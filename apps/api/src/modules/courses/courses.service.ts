import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateModuleDto, CreateVideoDto, CourseQueryDto, ReorderModulesDto, UpsertCourseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: CourseQueryDto, admin = false) {
    return this.prisma.course.findMany({
      where: {
        ...(admin ? {} : { isPublished: true }),
        ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(query.level ? { level: query.level } : {}),
        ...(query.minPrice || query.maxPrice
          ? { price: { gte: query.minPrice ?? 0, lte: query.maxPrice ?? undefined } }
          : {}),
      },
      include: {
        category: true,
        reviews: true,
        ...(admin
          ? { modules: { include: { videos: { orderBy: { position: 'asc' as const } } }, orderBy: { position: 'asc' as const } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detail(slug: string, admin = false) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        modules: { include: { videos: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
        reviews: { include: { user: { select: { name: true } } } },
      },
    });
    if (!course || (!admin && !course.isPublished)) throw new NotFoundException('Course not found');
    return course;
  }

  create(dto: UpsertCourseDto, adminId: string) {
    return this.prisma.course.create({ data: { ...dto, createdById: adminId } });
  }

  update(id: string, dto: Partial<UpsertCourseDto>, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.update({ where: { id }, data: dto });
      await tx.auditLog.create({ data: { adminId, action: 'COURSE_UPDATED', entityType: 'Course', entityId: id, metadata: dto } });
      return course;
    });
  }

  delete(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.delete({ where: { id } });
      await tx.auditLog.create({ data: { adminId, action: 'COURSE_DELETED', entityType: 'Course', entityId: id } });
      return course;
    });
  }

  addModule(courseId: string, dto: CreateModuleDto) {
    return this.prisma.courseModule.create({ data: { courseId, title: dto.title, position: dto.position } });
  }

  reorderModules(dto: ReorderModulesDto) {
    return this.prisma.$transaction(dto.items.map((item) => this.prisma.courseModule.update({ where: { id: item.id }, data: { position: item.position } })));
  }

  addVideo(moduleId: string, dto: CreateVideoDto) {
    return this.prisma.courseVideo.create({
      data: { moduleId, title: dto.title, position: dto.position, durationSeconds: dto.durationSeconds, isPreview: dto.isPreview },
    });
  }

  updateModule(id: string, dto: { title?: string; position?: number }) {
    return this.prisma.courseModule.update({ where: { id }, data: dto });
  }

  deleteModule(id: string) {
    return this.prisma.courseModule.delete({ where: { id } });
  }

  updateVideo(id: string, dto: { title?: string; position?: number; isPreview?: boolean }) {
    return this.prisma.courseVideo.update({ where: { id }, data: dto });
  }

  deleteVideo(id: string) {
    return this.prisma.courseVideo.delete({ where: { id } });
  }
}
