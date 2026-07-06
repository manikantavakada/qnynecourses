import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CourseExpiryService implements OnModuleInit {
  private readonly logger = new Logger(CourseExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.expireAccess();
    setInterval(() => void this.expireAccess(), 60 * 60 * 1000).unref();
  }

  private async expireAccess() {
    const result = await this.prisma.userCourse.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
    if (result.count) this.logger.log(`Expired ${result.count} course access records`);
  }
}
