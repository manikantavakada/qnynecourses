import { CourseLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CourseQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsEnum(CourseLevel) level?: CourseLevel;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
}

export class UpsertCourseDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() description: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @Type(() => Number) @IsInt() @Min(0) price: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) discountPrice?: number;
  @Type(() => Number) @IsInt() @Min(0) validityDays: number;
  @IsEnum(CourseLevel) level: CourseLevel;
  @IsString() language: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsBoolean() isPublished: boolean;
}

export class CreateModuleDto {
  @IsString() title: string;
  @Type(() => Number) @IsInt() @Min(0) position: number;
}

export class ReorderModulesDto {
  items: Array<{ id: string; position: number }>;
}

export class CreateVideoDto {
  @IsString() title: string;
  @Type(() => Number) @IsInt() @Min(0) position: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationSeconds?: number;
  @IsBoolean() isPreview: boolean;
}

export class UpdateModuleDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class UpdateVideoDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isPreview?: boolean;
}
