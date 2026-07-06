import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [revenue, activeStudents, soldThisMonth] = await Promise.all([
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.userCourse.count({ where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
      this.prisma.order.count({ where: { status: 'PAID', createdAt: { gte: startOfMonth } } }),
    ]);
    return { totalRevenue: revenue._sum.amount ?? 0, activeStudents, coursesSoldThisMonth: soldThisMonth };
  }

  async revenue() {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return orders.reduce<Record<string, number>>((acc, order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + order.amount;
      return acc;
    }, {});
  }

  orders() {
    return this.prisma.order.findMany({ include: { user: true, course: true, payment: true }, orderBy: { createdAt: 'desc' } });
  }
}
