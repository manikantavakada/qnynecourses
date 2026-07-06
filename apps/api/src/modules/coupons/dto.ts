import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ValidateCouponDto {
  @IsString() code: string;
  @IsString() courseId: string;
}

export class CouponDto {
  @IsString() code: string;
  @IsString() discountType: 'PERCENT' | 'FLAT';
  @Type(() => Number) @IsInt() @Min(1) discountValue: number;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxUses?: number;
  @IsDateString() validFrom: string;
  @IsDateString() validUntil: string;
  @IsBoolean() isActive: boolean;
}
