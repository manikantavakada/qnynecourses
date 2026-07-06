import { IsOptional, IsString, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { AccessStatus } from '@prisma/client';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateUserCourseDto {
  @IsOptional()
  @IsEnum(AccessStatus)
  status?: AccessStatus;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class EnrollUserDto {
  @IsString()
  courseId!: string;

  @IsOptional()
  @IsNumber()
  validityDays?: number;
}
