import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/loginUser.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOneEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate and return user without password', async () => {
      const email = 'test@test.com';
      const password = 'password';
      const userName = 'ddd';
      const user = {
        id: 'mockUser',
        email,
        password: await bcrypt.hash(password, 10),
        userName,
        refreshToken: 'dummyRefreshToken',
        updatedAt: new Date(),
        createdAt: new Date(),
        role: 'user',
        deletedAt: null,
      };

      jest.spyOn(userService, 'findOneEmail').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser(email, password);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        refreshToken: user.refreshToken,
        role: user.role,
        updatedAt: user.updatedAt,
        userName: user.userName,
      });
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(userService, 'findOneEmail').mockResolvedValue(null);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const password = '111';
      const user = {
        id: 'mockUser',
        email: 'test@test.com',
        password: await bcrypt.hash(password, 10),
        userName: 'username',
        refreshToken: 'dummyRefreshToken',
        updatedAt: new Date(),
        createdAt: new Date(),
        role: 'user',
        deletedAt: null,
      };

      jest.spyOn(userService, 'findOneEmail').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validateUser(
        'test@test.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and refresh token', async () => {
      const loginUserDto: LoginUserDto = {
        userName: 'username',
        email: 'test@test.com',
        password: 'password',
      };
      const user = {
        id: 'mockUser',
        userName: 'username',
        email: 'test@test.com',
        password: await bcrypt.hash('password', 10),
        role: 'user',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await service.login(loginUserDto);

      expect(result).toEqual({ access_token: 'token', refreshToken: 'token' });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { refreshToken: 'token' },
      });
    });
  });

  describe('getNewAccessToken', () => {
    it('should return new access token and refresh token', async () => {
      const refreshToken = 'oldRefreshToken';
      const user = {
        id: 'mockUser',
        userName: 'username',
        email: 'test@test.com',
        role: 'user',
      };
      const payload = { sub: user.id };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userService, 'findById').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue('newToken');

      const result = await service.getNewAccessToken(refreshToken);

      expect(result).toEqual({
        accessToken: 'newToken',
        refreshToken: 'newToken',
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { refreshToken: 'newToken' },
      });
    });

    it('should throw an error if refresh token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.getNewAccessToken('invalidToken')).rejects.toThrow(
        'Could not refresh access token',
      );
    });

    it('should throw an error if user is not found', async () => {
      const payload = { sub: 1 };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userService, 'findById').mockResolvedValue(null);

      await expect(service.getNewAccessToken('validToken')).rejects.toThrow(
        'Could not refresh access token',
      );
    });
  });
});
