import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

type VideoTokenClaims = { courseId: string; videoId: string };

@Injectable()
export class StreamService {
  private readonly s3: S3Client;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.config.get<string>('STORAGE_REGION') ?? 'auto',
      endpoint: this.config.getOrThrow<string>('STORAGE_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get<string>('STORAGE_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('STORAGE_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async verifyToken(token: string, courseId: string, videoId: string) {
    let claims: VideoTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<VideoTokenClaims>(token, {
        secret: this.config.getOrThrow<string>('VIDEO_TOKEN_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Playback token is invalid or expired');
    }
    if (claims.courseId !== courseId || claims.videoId !== videoId) {
      throw new ForbiddenException('Playback token does not match this video');
    }
  }

  async getObject(key: string) {
    const object = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.getOrThrow<string>('STORAGE_BUCKET_NAME'), Key: key }),
    );
    return object.Body;
  }

  contentTypeFor(file: string) {
    if (file.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (file.endsWith('.ts')) return 'video/mp2t';
    return 'application/octet-stream';
  }
}
