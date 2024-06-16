import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum SortOrder {
  LATEST = 'latest',
  POPULARITY = 'popularity',
}

export class SearchPostsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @IsString()
  period?: string;
}