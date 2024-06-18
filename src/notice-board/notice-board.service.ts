import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-board.dto';
import { UpdatePostDto } from './dto/update-board.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PostCategory } from '@prisma/client';
import { subDays, subMonths, subYears } from 'date-fns';
import { SearchPostsDto, SortOrder } from './dto/search-boards.dto';
import { PostResponseDTO } from './dto/response-board.dto';
import { plainToClass } from 'class-transformer';
import * as AWS from 'aws-sdk';

@Injectable()
export class PostService {
  private s3: AWS.S3;
  constructor(private prisma: PrismaService) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: 'ap-northeast-2',
    });
  }

  async createPost(
    createPostDto: CreatePostDto,
    authorId: string,
    userRole: string,
    imageUrl: string | null,
  ): Promise<PostResponseDTO> {
    if (
      createPostDto.category === PostCategory.NOTICES &&
      userRole !== 'admin'
    ) {
      throw new ForbiddenException('Only administrators can create notices');
    }
    const board = this.prisma.board.create({
      data: {
        ...createPostDto,
        authorId,
        imageUrl,
      },
    });

    return plainToClass(PostResponseDTO, board, {
      excludeExtraneousValues: true,
    });
  }

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
    userRole: string,
    newImageUrl: string,
  ): Promise<PostResponseDTO> {
    const post = await this.prisma.board.findUnique({ where: { id } });

    if (newImageUrl) {
      if (post.imageUrl) {
        await this.deleteImageFromS3(post.imageUrl);
      }
    }

    if (post?.category === PostCategory.NOTICES && userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can update notices');
    }
    const board = this.prisma.board.update({
      where: { id },
      data: {
        ...updatePostDto,
        imageUrl: newImageUrl || post.imageUrl,
      },
    });

    return plainToClass(PostResponseDTO, board, {
      excludeExtraneousValues: true,
    });
  }

  async deleteImageFromS3(imageUrl: string) {
    const key = imageUrl.split('.amazonaws.com/')[1];
    await this.s3
      .deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
      .promise();
  }

  async deletePost(id: string, userRole: string): Promise<PostResponseDTO> {
    const post = await this.prisma.board.findUnique({ where: { id } });
    if (post?.category === PostCategory.NOTICES && userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can delete notices');
    }
    const board = await this.prisma.board.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.comment.updateMany({
      where: { boardId: id },
      data: { deletedAt: new Date() },
    });

    return plainToClass(PostResponseDTO, board, {
      excludeExtraneousValues: true,
    });
  }

  async getPost(id: string): Promise<PostResponseDTO | null> {
    const board = await this.prisma.board.findUnique({
      where: { id, deletedAt: null },
    });

    if (board) {
      await this.prisma.board.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    return plainToClass(PostResponseDTO, board, {
      excludeExtraneousValues: true,
    });
  }

  async getPosts(searchPostsDto: SearchPostsDto): Promise<PostResponseDTO[]> {
    const {
      sortOrder = SortOrder.LATEST,
      period,
      keyword,
      title,
      author,
    } = searchPostsDto;
    let whereClause: any = { deletedAt: null };

    if (period) {
      const now = new Date();
      let dateFrom;
      if (period === 'week') {
        dateFrom = subDays(now, 7);
      } else if (period === 'month') {
        dateFrom = subMonths(now, 1);
      } else if (period === 'year') {
        dateFrom = subYears(now, 1);
      }
      if (dateFrom) {
        whereClause = {
          ...whereClause,
          createdAt: {
            gte: dateFrom,
          },
        };
      }
    }

    if (keyword) {
      whereClause = {
        ...whereClause,
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
          { author: { userName: { contains: keyword } } },
        ],
      };
    }

    if (title) {
      whereClause = {
        ...whereClause,
        title: { contains: title },
      };
    }

    if (author) {
      whereClause = {
        ...whereClause,
        author: { userName: { contains: author } },
      };
    }

    const boards = await this.prisma.board.findMany({
      where: whereClause,
      orderBy:
        sortOrder === SortOrder.POPULARITY
          ? { views: 'desc' }
          : { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        category: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: {
          select: {
            email: true,
            userName: true,
          },
        },
      },
    });

    return plainToClass(PostResponseDTO, boards, {
      excludeExtraneousValues: true,
    });
  }
}
