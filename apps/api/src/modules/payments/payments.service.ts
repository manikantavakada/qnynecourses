import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Razorpay from 'razorpay';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hmacSha256, timingSafeCompare } from '../../common/utils/crypto';
import { EmailJob } from '../email/email.service';

@Injectable()
export class PaymentsService {
  private readonly razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJob>,
  ) {
    this.razorpay = new Razorpay({
      key_id: config.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_missing',
      key_secret: config.get<string>('RAZORPAY_KEY_SECRET') || 'missing',
    });
  }

  async webhook(rawBody: Buffer, signature: string) {
    const expected = hmacSha256(rawBody.toString(), this.config.getOrThrow<string>('RAZORPAY_WEBHOOK_SECRET'));
    if (!timingSafeCompare(expected, signature)) throw new BadRequestException('Webhook signature is invalid');
    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      payload?: { payment?: { entity?: Record<string, unknown> } };
    };
    if (event.event !== 'payment.captured') return { ignored: true };
    const payment = event.payload?.payment?.entity;
    if (!payment) throw new BadRequestException('Webhook payload is missing payment');
    return this.grantAccessFromPayment(payment);
  }

  async grantAccessFromPayment(payment: Record<string, unknown>) {
    const razorpayPaymentId = String(payment.id);
    const razorpayOrderId = String(payment.order_id);
    const existing = await this.prisma.payment.findUnique({ where: { razorpayPaymentId } });
    if (existing) return { processed: false, payment: existing };

    const order = await this.prisma.order.findUnique({ where: { razorpayOrderId }, include: { course: true, user: true } });
    if (!order) throw new NotFoundException('Order not found');
    const expiresAt =
      order.course.validityDays === 0
        ? null
        : new Date(Date.now() + order.course.validityDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.$transaction(async (tx) => {
      const paidOrder = await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      const createdPayment = await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayPaymentId,
          razorpaySignature: 'webhook',
          method: typeof payment.method === 'string' ? payment.method : null,
          status: 'captured',
          rawPayload: payment as Prisma.InputJsonValue,
          paidAt: new Date(),
        },
      });
      const userCourse = await tx.userCourse.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
        create: { userId: order.userId, courseId: order.courseId, orderId: order.id, expiresAt },
        update: { status: 'ACTIVE', expiresAt },
      });
      if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      return { order: paidOrder, payment: createdPayment, userCourse };
    });
    await this.emailQueue.add('receipt', {
      type: 'receipt',
      to: order.user.email,
      name: order.user.name,
      courseTitle: order.course.title,
      amount: order.amount,
    });
    return { processed: true, ...result };
  }

  async refund(paymentId: string, revokeAccess: boolean) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.razorpay.payments.refund(payment.razorpayPaymentId, { speed: 'normal' });
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: 'REFUNDED' } });
      if (revokeAccess) {
        await tx.userCourse.updateMany({
          where: { userId: payment.order.userId, courseId: payment.order.courseId, orderId: payment.orderId },
          data: { status: 'REVOKED' },
        });
      }
      return updated;
    });
  }
}
