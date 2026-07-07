import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import Razorpay from 'razorpay';
import { PrismaService } from '../../common/prisma/prisma.service';
import { applyCoupon, coursePayableAmount } from '../../common/utils/money';
import { hmacSha256, timingSafeCompare } from '../../common/utils/crypto';
import { EmailJob } from '../email/email.service';
import { CreateOrderDto, VerifyOrderDto } from './dto';

@Injectable()
export class OrdersService {
  private readonly razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJob>,
    @InjectQueue('invoices') private readonly invoiceQueue: Queue<{ orderId: string; paymentId: string }>,
  ) {
    this.razorpay = new Razorpay({
      key_id: config.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_missing',
      key_secret: config.get<string>('RAZORPAY_KEY_SECRET') || 'missing',
    });
  }

  async create(userId: string, dto: CreateOrderDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || !course.isPublished) throw new NotFoundException('Course not found');
    const existingAccess = await this.prisma.userCourse.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });
    if (existingAccess && existingAccess.status === 'ACTIVE') throw new BadRequestException('Course is already owned');

    const coupon = dto.couponCode
      ? await this.prisma.coupon.findUnique({ where: { code: dto.couponCode.toUpperCase() } })
      : null;
    if (dto.couponCode && !coupon) throw new BadRequestException('Coupon is invalid');
    if (coupon) this.assertCouponValid(coupon, course.id);

    const { finalAmount, discountAmount } = applyCoupon(coursePayableAmount(course), coupon);
    if (finalAmount === 0) {
      return this.createLocalPaidOrder(userId, course, coupon?.id, finalAmount, discountAmount);
    }
    if (!this.hasRazorpayKeys()) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new BadRequestException('Payments are not configured. Contact support.');
      }
      return this.createLocalPaidOrder(userId, course, coupon?.id, finalAmount, discountAmount);
    }

    const rzOrder = await this.razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: `course_${course.id}_${Date.now()}`.slice(0, 40),
      notes: { userId, courseId: course.id },
    });
    const order = await this.prisma.order.create({
      data: {
        userId,
        courseId: course.id,
        couponId: coupon?.id,
        amount: finalAmount,
        discountAmount,
        razorpayOrderId: rzOrder.id,
      },
    });
    return { order, razorpayOrderId: rzOrder.id, amount: finalAmount, keyId: this.config.get<string>('RAZORPAY_KEY_ID') };
  }

  async verify(dto: VerifyOrderDto) {
    const expected = hmacSha256(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`, this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'));
    if (!timingSafeCompare(expected, dto.razorpay_signature)) throw new BadRequestException('Payment signature is invalid');
    const existing = await this.prisma.payment.findUnique({ where: { razorpayPaymentId: dto.razorpay_payment_id } });
    if (existing) return { verified: true, processed: false };

    const order = await this.prisma.order.findUnique({ where: { razorpayOrderId: dto.razorpay_order_id }, include: { course: true, user: true } });
    if (!order) throw new NotFoundException('Order not found');
    const expiresAt =
      order.course.validityDays === 0
        ? null
        : new Date(Date.now() + order.course.validityDays * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const paidOrder = await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayPaymentId: dto.razorpay_payment_id,
          razorpaySignature: dto.razorpay_signature,
          method: 'razorpay',
          status: 'captured',
          rawPayload: dto as unknown as Prisma.InputJsonValue,
          paidAt: new Date(),
        },
      });
      const userCourse = await tx.userCourse.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
        create: { userId: order.userId, courseId: order.courseId, orderId: order.id, expiresAt },
        update: { orderId: order.id, status: 'ACTIVE', expiresAt },
      });
      if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      return { order: paidOrder, payment, userCourse };
    });
    await this.emailQueue.add('receipt', {
      type: 'receipt',
      to: order.user.email,
      name: order.user.name,
      courseTitle: order.course.title,
      amount: order.amount,
    });
    await this.invoiceQueue.add('generate', { orderId: order.id, paymentId: result.payment.id });
    return { verified: true, processed: true, ...result };
  }

  private assertCouponValid(coupon: { isActive: boolean; validFrom: Date; validUntil: Date; maxUses: number | null; usedCount: number; courseId: string | null }, courseId: string) {
    const now = new Date();
    if (!coupon.isActive || coupon.validFrom > now || coupon.validUntil < now) throw new BadRequestException('Coupon is not active');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');
    if (coupon.courseId && coupon.courseId !== courseId) throw new BadRequestException('Coupon does not apply to this course');
  }

  private hasRazorpayKeys() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    return Boolean(keyId && keySecret && !keyId.includes('missing') && !keySecret.includes('missing'));
  }

  private async createLocalPaidOrder(
    userId: string,
    course: { id: string; validityDays: number },
    couponId: string | undefined,
    amount: number,
    discountAmount: number,
  ) {
    const now = Date.now();
    const razorpayOrderId = `local_order_${now}_${course.id.slice(0, 8)}`;
    const razorpayPaymentId = `local_payment_${now}_${course.id.slice(0, 8)}`;
    const expiresAt =
      course.validityDays === 0 ? null : new Date(Date.now() + course.validityDays * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          courseId: course.id,
          couponId,
          amount,
          discountAmount,
          razorpayOrderId,
          status: 'PAID',
        },
      });
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayPaymentId,
          razorpaySignature: 'local-checkout',
          method: 'local',
          status: 'captured',
          rawPayload: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            mode: 'local-checkout',
          } satisfies Prisma.InputJsonValue,
          paidAt: new Date(),
        },
      });
      const userCourse = await tx.userCourse.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        create: { userId, courseId: course.id, orderId: order.id, expiresAt },
        update: { orderId: order.id, status: 'ACTIVE', expiresAt },
      });
      if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      return { order, payment, userCourse };
    });

    return {
      ...result,
      razorpayOrderId,
      amount,
      keyId: this.config.get<string>('RAZORPAY_KEY_ID') ?? '',
      localCheckout: true,
      redirectTo: '/my-courses',
    };
  }
}
