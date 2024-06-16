import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-board.dto';
import { UpdatePostDto } from './dto/update-board.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Board, PostCategory } from '@prisma/client';
import { subDays, subMonths, subYears } from 'date-fns';
import { SearchPostsDto, SortOrder } from './dto/search-boards.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async createPost(
    createPostDto: CreatePostDto,
    authorId: string,
    userRole: string,
  ): Promise<Board> {
    if (
      createPostDto.category === PostCategory.NOTICES &&
      userRole !== 'admin'
    ) {
      throw new ForbiddenException('Only administrators can create notices');
    }
    return this.prisma.board.create({
      data: {
        ...createPostDto,
        authorId,
      },
    });
  }

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
    userRole: string,
  ): Promise<Board> {
    const post = await this.prisma.board.findUnique({ where: { id } });
    if (post?.category === PostCategory.NOTICES && userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can update notices');
    }
    return this.prisma.board.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async deletePost(id: string, userRole: string): Promise<Board> {
    const post = await this.prisma.board.findUnique({ where: { id } });
    if (post?.category === PostCategory.NOTICES && userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can delete notices');
    }
    return this.prisma.board.delete({
      where: { id },
    });
  }

  async getPost(id: string): Promise<Board | null> {
    const post = await this.prisma.board.findUnique({
      where: { id },
    });

    if (post) {
      await this.prisma.board.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    return post;
  }

  async getPosts(searchPostsDto: SearchPostsDto): Promise<Board[]> {
    const {
      sortOrder = SortOrder.LATEST,
      period,
      keyword,
      title,
      author,
    } = searchPostsDto;
    let whereClause = {};

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

    return this.prisma.board.findMany({
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
        author: {
          select: {
            email: true,
            userName: true,
          },
        },
      },
    });
  }
}
