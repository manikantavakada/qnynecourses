import { IsString } from 'class-validator';

export class ThumbnailUrlDto {
  @IsString() contentType: string;
  @IsString() fileName: string;
}

export class VideoInitDto {
  @IsString() fileName: string;
  @IsString() contentType: string;
}

export class VideoCompleteDto {
  @IsString() videoId: string;
  @IsString() sourceKey: string;
}
