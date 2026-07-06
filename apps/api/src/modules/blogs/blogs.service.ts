import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpsertBlogDto } from './dto';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(admin = false) {
    return this.prisma.blog.findMany({
      where: admin ? {} : { isPublished: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detail(slug: string, admin = false) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });
    if (!blog || (!admin && !blog.isPublished)) throw new NotFoundException('Blog not found');
    return blog;
  }

  create(dto: UpsertBlogDto, authorId: string) {
    return this.prisma.blog.create({ data: { ...dto, authorId } });
  }

  update(id: string, dto: Partial<UpsertBlogDto>) {
    return this.prisma.blog.update({ where: { id }, data: dto });
  }

  delete(id: string) {
    return this.prisma.blog.delete({ where: { id } });
  }
}
