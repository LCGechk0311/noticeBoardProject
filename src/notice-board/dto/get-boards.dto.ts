import { IsOptional, IsEnum, IsString } from 'class-validator';

export enum SortOrder {
  LATEST = 'latest',
  POPULARITY = 'popularity',
}

export class GetPostsDto {
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @IsString()
  period?: string;
}