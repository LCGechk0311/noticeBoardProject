import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CommentService', () => {
  let commentService: CommentService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: {
            comment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest
              .fn()
              .mockImplementation((fn) => fn(prismaService)),
          },
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Test comment',
        parentId: 'parent-id',
      };
      const boardId = 'board-id';
      const authorId = 'author-id';
      const createdComment = {
        id: 'comment-id',
        content: 'Test comment',
        boardId,
        authorId,
        parentId: 'parent-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(prismaService.comment, 'create')
        .mockResolvedValue(createdComment);

      const result = await commentService.createComment(
        createCommentDto,
        boardId,
        authorId,
      );

      expect(result).toEqual(createdComment);
      expect(prismaService.comment.create).toHaveBeenCalledWith({
        data: {
          ...createCommentDto,
          boardId,
          authorId,
        },
      });
    });
  });

  describe('getCommentsByPost', () => {
    it('should return comments for a post', async () => {
      const boardId = 'board-id';
      const comments = [
        {
          id: 'comment-id',
          content: 'Test comment',
          boardId,
          authorId: 'author-id',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: { email: 'test@test.com', userName: 'testuser' },
          replies: [],
        },
      ];

      jest.spyOn(prismaService.comment, 'findMany').mockResolvedValue(comments);

      const result = await commentService.getCommentsByPost(boardId);

      expect(result).toEqual(comments);
      expect(prismaService.comment.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const id = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const authorId = 'author-id';
      const existingComment = {
        id,
        content: 'Test comment',
        boardId: 'board-id',
        authorId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      const updatedComment = { ...existingComment, ...updateCommentDto };

      jest
        .spyOn(prismaService.comment, 'findUnique')
        .mockResolvedValue(existingComment);
      jest
        .spyOn(prismaService.comment, 'update')
        .mockResolvedValue(updatedComment);

      const result = await commentService.updateComment(
        id,
        updateCommentDto,
        authorId,
      );

      expect(result).toEqual(updatedComment);
      expect(prismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(prismaService.comment.update).toHaveBeenCalledWith({
        where: { id },
        data: updateCommentDto,
      });
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      const id = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const authorId = 'author-id';

      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(null);

      await expect(
        commentService.updateComment(id, updateCommentDto, authorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const id = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const authorId = 'author-id';
      const existingComment = {
        id,
        content: 'Test comment',
        boardId: 'board-id',
        authorId: 'another-author-id',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(prismaService.comment, 'findUnique')
        .mockResolvedValue(existingComment);

      await expect(
        commentService.updateComment(id, updateCommentDto, authorId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const id = 'comment-id';
      const authorId = 'author-id';
      const existingComment = {
        id,
        content: 'Test comment',
        boardId: 'board-id',
        authorId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        replies: [],
      };

      jest
        .spyOn(prismaService.comment, 'findUnique')
        .mockResolvedValue(existingComment);
      jest
        .spyOn(prismaService.comment, 'update')
        .mockResolvedValue({ ...existingComment, deletedAt: new Date() });

      const result = await commentService.deleteComment(id, authorId);

      expect(result).toEqual({
        ...existingComment,
        deletedAt: expect.any(Date),
      });
      expect(prismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { replies: true },
      });
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      const id = 'comment-id';
      const authorId = 'author-id';

      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(null);

      await expect(commentService.deleteComment(id, authorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const id = 'comment-id';
      const authorId = 'author-id';
      const existingComment = {
        id,
        content: 'Test comment',
        boardId: 'board-id',
        authorId: 'another-author-id',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        replies: [],
      };

      jest
        .spyOn(prismaService.comment, 'findUnique')
        .mockResolvedValue(existingComment);

      await expect(commentService.deleteComment(id, authorId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
