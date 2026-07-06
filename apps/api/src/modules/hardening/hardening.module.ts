import { Module } from '@nestjs/common';
import { CourseExpiryService } from './course-expiry.service';

@Module({ providers: [CourseExpiryService] })
export class HardeningModule {}
