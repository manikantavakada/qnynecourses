import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { applyCoupon, coursePayableAmount } from '../../common/utils/money';
import { CouponDto } from './dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, courseId: string) {
    const [coupon, course] = await Promise.all([
      this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } }),
      this.prisma.course.findUniqueOrThrow({ where: { id: courseId } }),
    ]);
    if (!coupon) throw new BadRequestException('Coupon is invalid');
    const now = new Date();
    if (!coupon.isActive || coupon.validFrom > now || coupon.validUntil < now) throw new BadRequestException('Coupon is not active');
    if (coupon.courseId && coupon.courseId !== courseId) throw new BadRequestException('Coupon does not apply to this course');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');
    return { coupon, ...applyCoupon(coursePayableAmount(course), coupon) };
  }

  list() {
    return this.prisma.coupon.findMany({ orderBy: { validUntil: 'desc' }, include: { course: true } });
  }

  create(dto: CouponDto) {
    return this.prisma.coupon.create({
      data: { ...dto, code: dto.code.toUpperCase(), validFrom: new Date(dto.validFrom), validUntil: new Date(dto.validUntil) },
    });
  }

  update(id: string, dto: Partial<CouponDto>) {
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code?.toUpperCase(),
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  delete(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
