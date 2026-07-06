import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertBlogDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() excerpt: string;
  @IsString() content: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsBoolean() isPublished: boolean;
}
