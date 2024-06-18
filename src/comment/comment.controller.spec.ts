import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('CommentController', () => {
  let commentController: CommentController;
  let commentService: CommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: {
            createComment: jest.fn(),
            getCommentsByPost: jest.fn(),
            updateComment: jest.fn(),
            deleteComment: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 'test-user-id' };
          return true;
        },
      })
      .compile();

    commentController = module.get<CommentController>(CommentController);
    commentService = module.get<CommentService>(CommentService);
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };
      const createdComment = {
        id: 'test-comment-id',
        content: 'Test comment',
        boardId: 'test-board-id',
        authorId: 'test-user-id',
        parentId: 'test-parent-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(commentService, 'createComment')
        .mockResolvedValue(createdComment);

      const result = await commentController.createComment(
        createCommentDto,
        createdComment.boardId,
        { user: { id: createdComment.authorId } },
      );

      expect(result).toEqual(createdComment);
      expect(commentService.createComment).toHaveBeenCalledWith(
        createCommentDto,
        createdComment.boardId,
        createdComment.authorId,
      );
    });
  });

  describe('getCommentsByPost', () => {
    it('should return comments for a post', async () => {
      const boardId = 'test-board-id';
      const comments = [
        {
          id: 'test-comment-id',
          content: 'Test comment',
          boardId: 'test-board-id',
          authorId: 'test-author-id',
          parentId: 'test-parent-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: { email: 'test@test.com', userName: 'testuser' },
          replies: [],
        },
      ];

      jest
        .spyOn(commentService, 'getCommentsByPost')
        .mockResolvedValue(comments);

      const result = await commentController.getCommentsByPost(boardId);

      expect(result).toEqual(comments);
      expect(commentService.getCommentsByPost).toHaveBeenCalledWith(boardId);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const id = 'test-comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const userId = 'test-user-id';
      const updatedComment = {
        id: 'test-comment-id',
        content: 'Updated comment',
        boardId: 'test-board-id',
        authorId: 'test-user-id',
        parentId: 'test-parent-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(commentService, 'updateComment')
        .mockResolvedValue(updatedComment);

      const result = await commentController.updateComment(
        id,
        updateCommentDto,
        { user: { id: userId } },
      );

      expect(result).toEqual(updatedComment);
      expect(commentService.updateComment).toHaveBeenCalledWith(
        id,
        updateCommentDto,
        userId,
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const id = 'test-comment-id';
      const userId = 'test-user-id';
      const deletedComment = {
        id: 'test-comment-id',
        content: 'Updated comment',
        boardId: 'test-board-id',
        authorId: 'test-user-id',
        parentId: 'test-parent-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      jest
        .spyOn(commentService, 'deleteComment')
        .mockResolvedValue(deletedComment);

      const result = await commentController.deleteComment(id, {
        user: { id: userId },
      });

      expect(result).toEqual(deletedComment);
      expect(commentService.deleteComment).toHaveBeenCalledWith(id, userId);
    });
  });
});
