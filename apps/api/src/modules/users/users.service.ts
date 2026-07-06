import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateMeDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true, emailVerified: true, avatarUrl: true },
    });
  }

  updateMe(userId: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, phone: true, role: true, emailVerified: true, avatarUrl: true },
    });
  }

  async listAdmin(search?: string, purchased?: boolean, page = 1, limit = 20) {
    const where = {
      role: 'STUDENT' as const,
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
        : {}),
      ...(purchased === undefined ? {} : { userCourses: purchased ? { some: {} } : { none: {} } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, createdAt: true, userCourses: { select: { id: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async adminDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
        orders: { include: { course: true, payment: true }, orderBy: { createdAt: 'desc' } },
        userCourses: { include: { course: true }, orderBy: { purchasedAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserCourse(id: string, dto: { status?: any; expiresAt?: string | null }) {
    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.expiresAt !== undefined) {
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    return this.prisma.userCourse.update({
      where: { id },
      data,
      include: { course: true },
    });
  }

  async enrollUser(userId: string, courseId: string, validityDays = 0) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const expiresAt = validityDays > 0 ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000) : null;
    const now = Date.now();
    const orderId = `manual_${now}_${courseId.slice(0, 8)}`;
    
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          courseId,
          amount: 0,
          status: 'PAID',
          razorpayOrderId: orderId,
        },
      });
      return tx.userCourse.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, orderId: order.id, expiresAt, status: 'ACTIVE' },
        update: { orderId: order.id, expiresAt, status: 'ACTIVE' },
        include: { course: true },
      });
    });
  }
}
