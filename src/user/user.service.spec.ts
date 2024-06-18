import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDTO } from './dto/response-user.dto';
import { plainToClass } from 'class-transformer';

jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            comment: {
              updateMany: jest.fn(),
            },
            board: {
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'user',
      };
      const hashedPassword = 'hashedPassword123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 'test-id',
        ...createUserDto,
        password: hashedPassword,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prismaService.user, 'create').mockResolvedValue(createdUser);

      const result = await userService.createUser(createUserDto);

      expect(result).toEqual(
        plainToClass(UserResponseDTO, createdUser, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });
    });
  });

  describe('findOneEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@test.com';
      const foundUser = {
        id: 'test-id',
        userName: 'testuser',
        email,
        password: 'password123',
        role: 'user',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(foundUser);

      const result = await userService.findOneEmail(email);

      expect(result).toEqual(foundUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email, deletedAt: null },
      });
    });

    it('should return null if user is not found', async () => {
      const email = 'test@test.com';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await userService.findOneEmail(email);

      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email, deletedAt: null },
      });
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const id = 'test-id';
      const foundUser = {
        id,
        userName: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'user',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(foundUser);

      const result = await userService.findById(id);

      expect(result).toEqual(
        plainToClass(UserResponseDTO, foundUser, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      const id = 'test-id';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(userService.findById(id)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 'test-id-1',
          userName: 'testuser1',
          email: 'test1@test.com',
          password: 'password123',
          role: 'user',
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'test-id-2',
          userName: 'testuser2',
          email: 'test2@test.com',
          password: 'password123',
          role: 'user',
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(users);

      const result = await userService.getAllUsers();

      expect(result).toEqual(
        plainToClass(UserResponseDTO, users, { excludeExtraneousValues: true }),
      );
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const id = 'test-id';
      const updateUserDto: UpdateUserDto = {
        userName: 'updatedUser',
        email: 'updated@test.com',
        password: 'updatedPassword',
        role: 'admin',
      };

      const updatedUser = {
        id,
        ...updateUserDto,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await userService.updateUser(id, updateUserDto);

      expect(result).toEqual(
        plainToClass(UserResponseDTO, updatedUser, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          ...updateUserDto,
        },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const id = 'test-id';
      const deletedUser = {
        id,
        userName: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'user',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'update').mockResolvedValue(deletedUser);
      jest
        .spyOn(prismaService.comment, 'updateMany')
        .mockResolvedValue({ count: 1 });
      jest
        .spyOn(prismaService.board, 'updateMany')
        .mockResolvedValue({ count: 1 });

      const result = await userService.deleteUser(id);

      expect(result).toEqual(
        plainToClass(UserResponseDTO, deletedUser, {
          excludeExtraneousValues: true,
        }),
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaService.comment.updateMany).toHaveBeenCalledWith({
        where: { authorId: id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaService.board.updateMany).toHaveBeenCalledWith({
        where: { authorId: id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
