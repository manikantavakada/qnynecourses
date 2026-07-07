import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlaybackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async play(videoId: string, userId: string) {
    const video = await this.prisma.courseVideo.findUnique({
      where: { id: videoId },
      include: { module: { include: { course: true } } },
    });
    if (!video || video.status !== 'READY' || !video.hlsMasterKey) throw new NotFoundException('Video is not ready');
    if (!video.isPreview) {
      const access = await this.prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId: video.module.courseId } },
      });
      const expired = access?.expiresAt ? access.expiresAt <= new Date() : false;
      if (!access || access.status !== 'ACTIVE' || expired) throw new ForbiddenException('Course access is not active');
    }
    if (video.hlsMasterKey.startsWith('demo/')) {
      return {
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        token: '',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      };
    }
    if (video.hlsMasterKey.startsWith('uploads/')) {
      const port = this.config.get<string>('PORT') ?? '4000';
      return {
        url: `http://localhost:${port}/${video.hlsMasterKey}`,
        token: '',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      };
    }
    const expiresInSeconds = 8 * 60;
    const token = await this.jwt.signAsync(
      { sub: userId, courseId: video.module.courseId, videoId },
      { secret: this.config.getOrThrow<string>('VIDEO_TOKEN_SECRET'), expiresIn: expiresInSeconds },
    );
    const base = this.streamBaseUrl();
    return {
      url: `${base}/${video.module.courseId}/${video.id}/master.m3u8?token=${token}`,
      token,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  private streamBaseUrl() {
    const cfWorkerUrl = this.config.get<string>('CF_WORKER_STREAM_URL');
    if (cfWorkerUrl) return `${cfWorkerUrl.replace(/\/$/, '')}/courses`;
    const apiUrl = this.config.getOrThrow<string>('API_PUBLIC_URL').replace(/\/$/, '');
    return `${apiUrl}/stream/courses`;
  }

  progress(videoId: string, userId: string, watchedSeconds: number, completed: boolean) {
    return this.prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, watchedSeconds, completed },
      update: { watchedSeconds, completed, lastWatchedAt: new Date() },
    });
  }
}
