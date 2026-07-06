import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ThumbnailUrlDto, VideoCompleteDto, VideoInitDto } from './dto';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('video-transcode') private readonly transcodeQueue: Queue,
  ) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.get<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async thumbnailUrl(dto: ThumbnailUrlDto) {
    const key = `thumbnails/${nanoid()}-${dto.fileName}`;
    const url = await this.signPut(key, dto.contentType);
    return { key, url };
  }

  async initVideo(dto: VideoInitDto) {
    const key = `sources/${nanoid()}-${dto.fileName}`;
    const url = await this.signPut(key, dto.contentType);
    return { uploadId: nanoid(), key, parts: [{ partNumber: 1, url }] };
  }

  async completeVideo(dto: VideoCompleteDto) {
    const video = await this.prisma.courseVideo.findUnique({ where: { id: dto.videoId }, include: { module: true } });
    if (!video) throw new NotFoundException('Video not found');
    await this.prisma.$transaction([
      this.prisma.courseVideo.update({ where: { id: video.id }, data: { sourceKey: dto.sourceKey, status: 'PROCESSING' } }),
      this.prisma.videoProcessingJob.upsert({
        where: { videoId: video.id },
        create: { videoId: video.id, status: 'PROCESSING', startedAt: new Date() },
        update: { status: 'PROCESSING', progress: 0, errorMessage: null, startedAt: new Date(), completedAt: null },
      }),
    ]);
    await this.transcodeQueue.add('transcode', {
      videoId: video.id,
      courseId: video.module.courseId,
      sourceKey: dto.sourceKey,
    });
    return { videoId: video.id, status: 'PROCESSING' };
  }

  async localVideo(videoId: string, file: { originalname: string; mimetype: string; size: number; path: string }) {
    const video = await this.prisma.courseVideo.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');
    const sourceKey = file.path.replace(/\\/g, '/');
    return this.prisma.courseVideo.update({
      where: { id: videoId },
      data: {
        sourceKey,
        hlsMasterKey: sourceKey,
        status: 'READY',
      },
      select: { id: true, title: true, sourceKey: true, status: true },
    });
  }

  status(videoId: string) {
    return this.prisma.videoProcessingJob.findUniqueOrThrow({ where: { videoId } });
  }

  private signPut(key: string, contentType: string) {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.config.getOrThrow<string>('R2_BUCKET_NAME'),
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 900 },
    );
  }
}
