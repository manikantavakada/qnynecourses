import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/auth/roles.decorator';
import { ThumbnailUrlDto, VideoCompleteDto, VideoInitDto } from './dto';
import { UploadService } from './upload.service';

@Roles('ADMIN')
@Controller('admin/upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('thumbnail-url')
  thumbnail(@Body() dto: ThumbnailUrlDto) {
    return this.upload.thumbnailUrl(dto);
  }

  @Post('video/init')
  init(@Body() dto: VideoInitDto) {
    return this.upload.initVideo(dto);
  }

  @Post('video/complete')
  complete(@Body() dto: VideoCompleteDto) {
    return this.upload.completeVideo(dto);
  }

  @Post('video/local/:videoId')
  @UseInterceptors(FileInterceptor('file', { dest: 'uploads/videos' }))
  localUpload(
    @Param('videoId') videoId: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; path: string },
  ) {
    return this.upload.localVideo(videoId, file);
  }

  @Get('video/:id/status')
  status(@Param('id') id: string) {
    return this.upload.status(id);
  }
}
