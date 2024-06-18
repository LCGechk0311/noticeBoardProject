import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            findById: jest.fn(),
            getAllUsers: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'user',
      };

      const createdUser = {
        id: 'test-id',
        ...createUserDto,
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(createdUser);

      const result = await userController.register(createUserDto);

      expect(result).toEqual(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const id = 'test-id';
      const foundUser = {
        id,
        userName: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'user',
      };

      jest.spyOn(userService, 'findById').mockResolvedValue(foundUser);

      const result = await userController.getUser(id);

      expect(result).toEqual(foundUser);
      expect(userService.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const id = 'test-id';

      jest
        .spyOn(userService, 'findById')
        .mockRejectedValue(new NotFoundException());

      await expect(userController.getUser(id)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users for admin', async () => {
      const users = [
        {
          id: 'test-id-1',
          userName: 'testuser1',
          email: 'test1@test.com',
          password: 'password123',
          role: 'user',
        },
        {
          id: 'test-id-2',
          userName: 'testuser2',
          email: 'test2@test.com',
          password: 'password123',
          role: 'user',
        },
      ];

      jest.spyOn(userService, 'getAllUsers').mockResolvedValue(users);

      const result = await userController.getAllUsers();

      expect(result).toEqual(users);
      expect(userService.getAllUsers).toHaveBeenCalled();
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
      };

      jest.spyOn(userService, 'updateUser').mockResolvedValue(updatedUser);

      const req = { user: { id, role: 'admin' } };
      const result = await userController.updateUser(id, updateUserDto, req);

      expect(result).toEqual(updatedUser);
      expect(userService.updateUser).toHaveBeenCalledWith(id, updateUserDto);
    });

    it('should throw ForbiddenException if user is not admin and tries to update another user', async () => {
      const id = 'test-id';
      const updateUserDto: UpdateUserDto = {
        userName: 'updatedUser',
        email: 'updated@test.com',
        password: 'updatedPassword',
        role: 'admin',
      };

      const req = { user: { id: 'different-id', role: 'user' } };

      await expect(
        userController.updateUser(id, updateUserDto, req),
      ).rejects.toThrow(ForbiddenException);
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
      };

      jest.spyOn(userService, 'deleteUser').mockResolvedValue(deletedUser);

      const req = { user: { id, role: 'admin' } };
      const result = await userController.deleteUser(id, req);

      expect(result).toEqual(deletedUser);
      expect(userService.deleteUser).toHaveBeenCalledWith(id);
    });

    it('should throw ForbiddenException if user is not admin and tries to delete another user', async () => {
      const id = 'test-id';
      const req = { user: { id: 'different-id', role: 'user' } };

      await expect(userController.deleteUser(id, req)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
