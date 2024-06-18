import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './notice-board.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-board.dto';
import { UpdatePostDto } from './dto/update-board.dto';
import { PostCategory } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { PostResponseDTO } from './dto/response-board.dto';
import { plainToClass } from 'class-transformer';
import * as AWS from 'aws-sdk';
import { SortOrder } from './dto/search-boards.dto';

jest.mock('aws-sdk', () => {
  const S3 = {
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return { S3: jest.fn(() => S3) };
});

describe('PostService', () => {
  let postService: PostService;
  let prismaService: PrismaService;
  let s3: AWS.S3;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: {
            board: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            comment: {
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
    prismaService = module.get<PrismaService>(PrismaService);
    s3 = new AWS.S3();
  });

  describe('createPost', () => {
    it('should create a post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
      };
      const authorId = 'test-author-id';
      const userRole = 'user';
      const imageUrl = 'test-image-url';
      const createdPost = {
        id: 'test-post-id',
        ...createPostDto,
        authorId,
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        deletedAt: null,
        author: {
          id: 'test-author-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest.spyOn(prismaService.board, 'create').mockResolvedValue(createdPost);

      const result = await postService.createPost(
        createPostDto,
        authorId,
        userRole,
        imageUrl,
      );

      expect(result).toEqual(
        plainToClass(PostResponseDTO, createdPost, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.board.create).toHaveBeenCalledWith({
        data: {
          ...createPostDto,
          authorId,
          imageUrl,
        },
      });
    });

    it('should throw ForbiddenException if user is not an admin and tries to create a notice', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.NOTICES,
      };
      const authorId = 'test-author-id';
      const userRole = 'user';
      const imageUrl = 'test-image-url';

      await expect(
        postService.createPost(createPostDto, authorId, userRole, imageUrl),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };
      const id = 'test-post-id';
      const userRole = 'user';
      const newImageUrl = 'updated-image-url';
      const existingPost = {
        id,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'test-author-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'test-author-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      const updatedPost = {
        ...existingPost,
        ...updatePostDto,
        imageUrl: newImageUrl,
      };

      jest
        .spyOn(prismaService.board, 'findUnique')
        .mockResolvedValue(existingPost);
      jest.spyOn(prismaService.board, 'update').mockResolvedValue(updatedPost);
      jest.spyOn(s3, 'deleteObject').mockReturnValue({
        promise: jest.fn(),
      } as any);

      const result = await postService.updatePost(
        id,
        updatePostDto,
        userRole,
        newImageUrl,
      );

      expect(result).toEqual(
        plainToClass(PostResponseDTO, updatedPost, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.board.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          ...updatePostDto,
          imageUrl: newImageUrl,
        },
      });
    });

    it('should throw ForbiddenException if user is not an admin and tries to update a notice', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };
      const id = 'test-post-id';
      const userRole = 'user';
      const newImageUrl = 'updated-image-url';
      const existingPost = {
        id,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.NOTICES,
        authorId: 'test-author-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'test-author-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest
        .spyOn(prismaService.board, 'findUnique')
        .mockResolvedValue(existingPost);

      await expect(
        postService.updatePost(id, updatePostDto, userRole, newImageUrl),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const id = 'test-post-id';
      const userRole = 'admin';
      const existingPost = {
        id,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'test-author-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'test-author-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      const deletedPost = {
        ...existingPost,
        deletedAt: new Date(),
      };

      jest
        .spyOn(prismaService.board, 'findUnique')
        .mockResolvedValue(existingPost);
      jest.spyOn(prismaService.board, 'update').mockResolvedValue(deletedPost);
      jest
        .spyOn(prismaService.comment, 'updateMany')
        .mockResolvedValue({ count: 1 });

      const result = await postService.deletePost(id, userRole);

      expect(result).toEqual(
        plainToClass(PostResponseDTO, deletedPost, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.board.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaService.comment.updateMany).toHaveBeenCalledWith({
        where: { boardId: id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException if user is not an admin and tries to delete a notice', async () => {
      const id = 'test-post-id';
      const userRole = 'user';
      const existingPost = {
        id,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.NOTICES,
        authorId: 'test-author-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'test-author-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest
        .spyOn(prismaService.board, 'findUnique')
        .mockResolvedValue(existingPost);

      await expect(postService.deletePost(id, userRole)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getPost', () => {
    it('should return a post by id', async () => {
      const id = 'test-post-id';
      const existingPost = {
        id,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'test-author-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'test-author-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest
        .spyOn(prismaService.board, 'findUnique')
        .mockResolvedValue(existingPost);
      jest.spyOn(prismaService.board, 'update').mockResolvedValue(existingPost);

      const result = await postService.getPost(id);

      expect(result).toEqual(
        plainToClass(PostResponseDTO, existingPost, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
      expect(prismaService.board.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('getPosts', () => {
    it('should return a list of posts', async () => {
      const searchPostsDto = {
        keyword: 'test',
        sortOrder: SortOrder.LATEST,
      };
      const posts = [
        {
          id: 'test-post-id-1',
          title: 'Test Title 1',
          content: 'Test Content 1',
          category: PostCategory.QNA,
          authorId: 'test-author-id-1',
          imageUrl: 'test-image-url-1',
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: {
            id: 'test-author-id-1',
            userName: 'testuser1',
            email: 'test1@test.com',
            role: 'user',
          },
        },
        {
          id: 'test-post-id-2',
          title: 'Test Title 2',
          content: 'Test Content 2',
          category: PostCategory.QNA,
          authorId: 'test-author-id-2',
          imageUrl: 'test-image-url-2',
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: {
            id: 'test-author-id-2',
            userName: 'testuser2',
            email: 'test2@test.com',
          },
        },
      ];

      jest.spyOn(prismaService.board, 'findMany').mockResolvedValue(posts);

      const result = await postService.getPosts(searchPostsDto);

      expect(result).toEqual(
        plainToClass(PostResponseDTO, posts, { excludeExtraneousValues: true }),
      );
      expect(prismaService.board.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { title: { contains: 'test' } },
            { content: { contains: 'test' } },
            { author: { userName: { contains: 'test' } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
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
    });
  });
});
