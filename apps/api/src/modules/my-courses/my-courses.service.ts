import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MyCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async courses(userId: string) {
    const rows = await this.prisma.userCourse.findMany({
      where: { userId, status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: {
        course: { include: { modules: { include: { videos: true } } } },
      },
      orderBy: { purchasedAt: 'desc' },
    });
    const progress = await this.prisma.videoProgress.findMany({ where: { userId } });
    return rows.map((row) => {
      const videoIds = row.course.modules.flatMap((module) => module.videos.map((video) => video.id));
      const completed = progress.filter((item) => videoIds.includes(item.videoId) && item.completed).length;
      const progressPercent = videoIds.length ? Math.round((completed / videoIds.length) * 100) : 0;
      return { ...row, progressPercent };
    });
  }

  certificates(userId: string) {
    return this.prisma.certificate.findMany({ where: { userId }, orderBy: { issuedAt: 'desc' } });
  }
}
