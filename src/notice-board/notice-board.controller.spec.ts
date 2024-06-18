import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './notice-board.controller';
import { PostService } from './notice-board.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';
import { CreatePostDto, CustomFile } from './dto/create-board.dto';
import { UpdatePostDto } from './dto/update-board.dto';
import { SearchPostsDto } from './dto/search-boards.dto';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PostCategory } from '@prisma/client';

describe('PostController', () => {
  let postController: PostController;
  let postService: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: {
            createPost: jest.fn(),
            getPost: jest.fn(),
            getPosts: jest.fn(),
            updatePost: jest.fn(),
            deletePost: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 'test-user-id', userRole: 'user' };
          return true;
        },
      })
      .compile();

    postController = module.get<PostController>(PostController);
    postService = module.get<PostService>(PostService);
  });

  describe('createPost', () => {
    it('should create a post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
      };
      const file: CustomFile = { location: 'test-image-url' } as CustomFile;
      const createdPost = {
        id: 'test-post-id',
        ...createPostDto,
        authorId: 'test-user-id',
        imageUrl: file.location,
        views: 0,
        createdAt: new Date(),
        author: {
          id: 'test-user-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest.spyOn(postService, 'createPost').mockResolvedValue(createdPost);

      const result = await postController.createPost(file, createPostDto, {
        user: { id: 'test-user-id', userRole: 'user' },
      });

      expect(result).toEqual(createdPost);
      expect(postService.createPost).toHaveBeenCalledWith(
        createPostDto,
        'test-user-id',
        'user',
        file.location,
      );
    });
  });

  describe('getPost', () => {
    it('should return a post by id', async () => {
      const postId = 'test-post-id';
      const post = {
        id: postId,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'test-user-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        author: {
          id: 'test-user-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest.spyOn(postService, 'getPost').mockResolvedValue(post);

      const result = await postController.getPost(postId);

      expect(result).toEqual(post);
      expect(postService.getPost).toHaveBeenCalledWith(postId);
    });
  });

  describe('getPosts', () => {
    it('should return a list of posts', async () => {
      const searchPostsDto: SearchPostsDto = { keyword: 'test' };
      const posts = [
        {
          id: 'test-post-id-1',
          title: 'Test Title 1',
          content: 'Test Content 1',
          category: PostCategory.QNA,
          authorId: 'test-user-id-1',
          imageUrl: 'test-image-url-1',
          views: 0,
          createdAt: new Date(),
          author: {
            id: 'test-user-id-1',
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
          authorId: 'test-user-id-2',
          imageUrl: 'test-image-url-2',
          views: 0,
          createdAt: new Date(),
          author: {
            id: 'test-user-id-2',
            userName: 'testuser2',
            email: 'test2@test.com',
            role: 'user',
          },
        },
      ];

      jest.spyOn(postService, 'getPosts').mockResolvedValue(posts);

      const result = await postController.getPosts(searchPostsDto);

      expect(result).toEqual(posts);
      expect(postService.getPosts).toHaveBeenCalledWith(searchPostsDto);
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };
      const file: CustomFile = { location: 'updated-image-url' } as CustomFile;
      const postId = 'test-post-id';
      const updatedPost = {
        id: postId,
        title: 'Test Title',
        content: 'Test Content',
        authorId: 'test-user-id',
        imageUrl: file.location,
        category: PostCategory.QNA,
        views: 0,
        createdAt: new Date(),
        author: {
          id: 'test-user-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest.spyOn(postService, 'getPost').mockResolvedValue(updatedPost);
      jest.spyOn(postService, 'updatePost').mockResolvedValue(updatedPost);

      const result = await postController.updatePost(
        postId,
        file,
        updatePostDto,
        {
          user: { id: 'test-user-id', userRole: 'user' },
        },
      );

      expect(result).toEqual(updatedPost);
      expect(postService.updatePost).toHaveBeenCalledWith(
        postId,
        updatePostDto,
        'user',
        file.location,
      );
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };
      const file: CustomFile = { location: 'updated-image-url' } as CustomFile;
      const postId = 'test-post-id';
      const existingPost = {
        id: postId,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'another-user-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        author: {
          id: 'another-user-id',
          userName: 'anotheruser',
          email: 'another@test.com',
          role: 'user',
        },
      };

      jest.spyOn(postService, 'getPost').mockResolvedValue(existingPost);

      await expect(
        postController.updatePost(postId, file, updatePostDto, {
          user: { id: 'test-user-id', userRole: 'user' },
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const postId = 'test-post-id';
      const existingPost = {
        id: postId,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'test-user-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        author: {
          id: 'test-user-id',
          userName: 'testuser',
          email: 'test@test.com',
          role: 'user',
        },
      };

      jest.spyOn(postService, 'getPost').mockResolvedValue(existingPost);
      jest.spyOn(postService, 'deletePost').mockResolvedValue(existingPost);

      const result = await postController.deletePost(postId, {
        user: { id: 'test-user-id', userRole: 'user' },
      });

      expect(result).toEqual(existingPost);
      expect(postService.deletePost).toHaveBeenCalledWith(postId, 'user');
    });

    it('should throw ForbiddenException if user is not the author and not an admin', async () => {
      const postId = 'test-post-id';
      const existingPost = {
        id: postId,
        title: 'Test Title',
        content: 'Test Content',
        category: PostCategory.QNA,
        authorId: 'another-user-id',
        imageUrl: 'test-image-url',
        views: 0,
        createdAt: new Date(),
        author: {
          id: 'another-user-id',
          userName: 'anotheruser',
          email: 'another@test.com',
          role: 'user',
        },
      };

      jest.spyOn(postService, 'getPost').mockResolvedValue(existingPost);

      await expect(
        postController.deletePost(postId, {
          user: { id: 'test-user-id', userRole: 'user' },
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
