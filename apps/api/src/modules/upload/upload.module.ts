import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'video-transcode' })],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
