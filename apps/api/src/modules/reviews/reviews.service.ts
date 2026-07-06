import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  list(courseId: string) {
    return this.prisma.review.findMany({ where: { courseId }, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async create(courseId: string, userId: string, rating: number, comment?: string) {
    const access = await this.prisma.userCourse.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (!access || access.status !== 'ACTIVE') throw new ForbiddenException('Purchase required to review this course');
    return this.prisma.review.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, rating, comment },
      update: { rating, comment },
    });
  }
}
