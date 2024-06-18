import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    boardId: string,
    authorId: string,
  ) {
    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        boardId,
        authorId,
      },
    });
  }

  async getCommentsByPost(boardId: string) {
    return this.prisma.comment.findMany({
      where: { boardId, parentId: null, deletedAt: null },
      include: {
        replies: {
          where: {
            deletedAt: null,
          },
          include: {
            author: { select: { email: true, userName: true } },
          },
        },
        author: { select: { email: true, userName: true } },
      },
    });
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    authorId: string,
  ) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== authorId) {
      throw new NotFoundException('Unauthorized');
    }
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  async deleteComment(id: string, authorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { replies: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (prisma) => {
      if (comment.replies.length > 0) {
        await prisma.comment.updateMany({
          where: { parentId: comment.id },
          data: { deletedAt: now },
        });
      }
      return prisma.comment.update({
        where: { id: comment.id },
        data: { deletedAt: now },
      });
    });
  }
}
