import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/loginUser.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            getNewAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const loginUserDto: LoginUserDto = {
        userName: 'username',
        email: 'test@test.com',
        password: 'password',
      };
      const tokens = {
        access_token: 'accessToken',
        refreshToken: 'refreshToken',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(tokens);

      const result = await authController.login(loginUserDto);
      expect(result).toEqual(tokens);
      // expect(authService.login).toHaveBeenCalledWith(loginUserDto);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.getNewAccessToken and return new tokens', async () => {
      const refreshToken = 'someRefreshToken';
      const newTokens = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };

      jest.spyOn(authService, 'getNewAccessToken').mockResolvedValue(newTokens);

      const result = await authController.refreshToken(refreshToken);
      expect(result).toEqual(newTokens);
      expect(authService.getNewAccessToken).toHaveBeenCalledWith(refreshToken);
    });
  });
});
