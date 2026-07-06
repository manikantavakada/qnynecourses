import { IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString() courseId: string;
  @IsOptional() @IsString() couponCode?: string;
}

export class VerifyOrderDto {
  @IsString() razorpay_order_id: string;
  @IsString() razorpay_payment_id: string;
  @IsString() razorpay_signature: string;
}
