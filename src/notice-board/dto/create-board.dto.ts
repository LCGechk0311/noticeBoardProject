import { IsString, IsEnum } from 'class-validator';
import { PostCategory } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(PostCategory)
  category: PostCategory;
}
