import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PostCategory } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(PostCategory)
  category: PostCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export interface CustomFile extends Express.Multer.File {
  location: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
  acl: string;
  contentType: string;
  contentDisposition: string;
  contentEncoding: string;
  storageClass: string;
  serverSideEncryption: string;
  metadata: string;
  etag: string;
  versionId: string;
}