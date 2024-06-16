import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PostCategory } from '@prisma/client';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(PostCategory)
  @IsOptional()
  category?: PostCategory;
}