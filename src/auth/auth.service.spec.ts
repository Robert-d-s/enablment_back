import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserCoreService } from '../user/user-core.service';
import { UserSecurityService } from '../user/services/user-security.service';
import { TokenBlacklistService } from '../common/services/token-blacklist.service';
import { TokenService } from './token.service';
import { getLoggerToken } from 'nestjs-pino';
import { UserRole } from '@prisma/client';
import { ResourceConflictException } from '../common/exceptions/base.exception';

describe('AuthService', () => {
  let service: AuthService;
  let userCoreService: jest.Mocked<UserCoreService>;
  let userSecurityService: jest.Mocked<UserSecurityService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.COLLABORATOR,
    tokenVersion: 1,
    hashedRefreshToken: 'hashedRefreshToken',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserCoreService,
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: UserSecurityService,
          useValue: {
            verifyPassword: jest.fn(),
            validateEmail: jest.fn(),
            validatePassword: jest.fn(),
            hashData: jest.fn(),
            clearRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            updateRefreshTokenHash: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            blacklistToken: jest.fn(),
            isTokenBlacklisted: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokens: jest.fn(),
            getAccessTokenJti: jest.fn(),
            getTokenExpiry: jest.fn(),
            verifyRefreshToken: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(AuthService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userCoreService = module.get(UserCoreService);
    userSecurityService = module.get(UserSecurityService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const username = 'test@example.com';
      const password = 'password123';
      const tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };

      userCoreService.findOne.mockResolvedValue(mockUser);
      userSecurityService.verifyPassword.mockResolvedValue(true);
      tokenService.generateTokens.mockResolvedValue(tokens);
      userSecurityService.hashData.mockResolvedValue('hashedRefreshToken');

      const result = await service.signIn(username, password);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      expect(userCoreService.findOne).toHaveBeenCalledWith(username);
      expect(userSecurityService.verifyPassword).toHaveBeenCalledWith(
        password,
        mockUser.password,
      );
      expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser);
    });

    it('should throw invalid credentials when user not found', async () => {
      userCoreService.findOne.mockResolvedValue(undefined);

      await expect(
        service.signIn('nonexistent@example.com', 'password'),
      ).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Sign-in failed: User %s not found',
        'nonexistent@example.com',
      );
    });

    it('should throw invalid credentials when password does not match', async () => {
      userCoreService.findOne.mockResolvedValue(mockUser);
      userSecurityService.verifyPassword.mockResolvedValue(false);

      await expect(
        service.signIn('test@example.com', 'wrongpassword'),
      ).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Sign-in failed: Password mismatch for user %s',
        'test@example.com',
      );
    });
  });

  describe('signUp', () => {
    it('should successfully create first user as ADMIN', async () => {
      const email = 'admin@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      userCoreService.count.mockResolvedValue(0);
      userCoreService.findOne.mockResolvedValue(undefined);
      userSecurityService.hashData.mockResolvedValue(hashedPassword);
      userCoreService.create.mockResolvedValue({
        ...mockUser,
        email,
        role: UserRole.ADMIN,
        hashedRefreshToken: null,
      });

      const result = await service.signUp(email, password);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(userCoreService.create).toHaveBeenCalledWith(
        email,
        hashedPassword,
        UserRole.ADMIN,
      );
    });

    it('should create subsequent users as PENDING', async () => {
      const email = 'user@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      userCoreService.count.mockResolvedValue(1);
      userCoreService.findOne.mockResolvedValue(undefined);
      userSecurityService.hashData.mockResolvedValue(hashedPassword);
      userCoreService.create.mockResolvedValue({
        ...mockUser,
        email,
        role: UserRole.PENDING,
        hashedRefreshToken: null,
      });

      const result = await service.signUp(email, password);

      expect(result.role).toBe(UserRole.PENDING);
      expect(userCoreService.create).toHaveBeenCalledWith(
        email,
        hashedPassword,
        UserRole.PENDING,
      );
    });

    it('should throw ResourceConflictException when user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      userCoreService.count.mockResolvedValue(1);
      userCoreService.findOne.mockResolvedValue(mockUser);

      await expect(service.signUp(email, password)).rejects.toThrow(
        ResourceConflictException,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Sign-up failed: Email %s already exists',
        email,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user with access token', async () => {
      const userId = 1;
      const accessToken = 'access_token';
      const jti = 'token_jti';
      const expiresAt = Date.now() + 3600000;

      tokenService.getAccessTokenJti.mockReturnValue(jti);
      tokenService.getTokenExpiry.mockReturnValue(expiresAt);
      userSecurityService.clearRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(userId, accessToken);

      expect(result).toBe(true);
      expect(tokenBlacklistService.blacklistToken).toHaveBeenCalledWith(jti, {
        ttlMs: expect.any(Number),
      });
      expect(userSecurityService.clearRefreshToken).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should successfully logout user without access token', async () => {
      const userId = 1;

      userSecurityService.clearRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(userId);

      expect(result).toBe(true);
      expect(tokenBlacklistService.blacklistToken).not.toHaveBeenCalled();
      expect(userSecurityService.clearRefreshToken).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh_token';
    const userId = 1;
    const refreshPayload = { jti: 'refresh_jti', sub: userId };

    it('should successfully refresh tokens', async () => {
      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      tokenService.verifyRefreshToken.mockResolvedValue(refreshPayload);
      tokenBlacklistService.isTokenBlacklisted.mockReturnValue(false);
      userCoreService.findById.mockResolvedValue(mockUser);
      userSecurityService.verifyRefreshToken.mockResolvedValue(true);
      tokenService.generateTokens.mockResolvedValue(newTokens);
      userSecurityService.hashData.mockResolvedValue('newHashedToken');

      const result = await service.refreshToken(userId, refreshToken);

      expect(result).toEqual(newTokens);
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(userSecurityService.verifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
        mockUser.hashedRefreshToken,
      );
    });

    it('should throw when refresh token is blacklisted', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(refreshPayload);
      tokenBlacklistService.isTokenBlacklisted.mockReturnValue(true);

      await expect(
        service.refreshToken(userId, refreshToken),
      ).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId, jti: refreshPayload.jti },
        'Attempted refresh with blacklisted token',
      );
    });

    it('should throw when user not found', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(refreshPayload);
      tokenBlacklistService.isTokenBlacklisted.mockReturnValue(false);
      userCoreService.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken(userId, refreshToken),
      ).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Refresh Denied: User ${userId} not found or no stored hash.`,
      );
    });

    it('should throw when refresh token does not match', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(refreshPayload);
      tokenBlacklistService.isTokenBlacklisted.mockReturnValue(false);
      userCoreService.findById.mockResolvedValue(mockUser);
      userSecurityService.verifyRefreshToken.mockResolvedValue(false);

      await expect(
        service.refreshToken(userId, refreshToken),
      ).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Refresh Denied: Provided token does not match stored hash for user ${userId}.`,
      );
    });
  });
});
