import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from '../common/services/token-blacklist.service';
import { getLoggerToken } from 'nestjs-pino';
import { UserRole } from '@prisma/client';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.COLLABORATOR,
    tokenVersion: 1,
    hashedRefreshToken: null,
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
        TokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            trackUserToken: jest.fn(),
            isTokenBlacklisted: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(TokenService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    tokenBlacklistService = module.get(TokenBlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';

      configService.get
        .mockReturnValueOnce('access_secret')
        .mockReturnValueOnce('15m')
        .mockReturnValueOnce('refresh_secret')
        .mockReturnValueOnce('7d');

      jwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      const result = await service.generateTokens(mockUser);

      expect(result).toEqual({ accessToken, refreshToken });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);

      // Verify access token payload
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          email: mockUser.email,
          sub: mockUser.id,
          id: mockUser.id,
          role: mockUser.role,
          tokenVersion: mockUser.tokenVersion,
          jti: expect.any(String),
        }),
        {
          secret: 'access_secret',
          expiresIn: '15m',
        },
      );

      // Verify refresh token payload
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: mockUser.id,
          jti: expect.any(String),
        }),
        {
          secret: 'refresh_secret',
          expiresIn: '7d',
        },
      );

      expect(tokenBlacklistService.trackUserToken).toHaveBeenCalledTimes(2);
    });

    it('should use default expiration times when not configured', async () => {
      configService.get
        .mockReturnValueOnce('access_secret')
        .mockReturnValueOnce(null) // No access expiration configured
        .mockReturnValueOnce('refresh_secret')
        .mockReturnValueOnce(null); // No refresh expiration configured

      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      await service.generateTokens(mockUser);

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        {
          secret: 'access_secret',
          expiresIn: '15m', // Default
        },
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        {
          secret: 'refresh_secret',
          expiresIn: '7d', // Default
        },
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return refresh token payload', async () => {
      const token = 'refresh_token';
      const payload = { sub: 1, jti: 'refresh_jti' };

      configService.get.mockReturnValue('refresh_secret');
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyRefreshToken(token);

      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'refresh_secret',
      });
    });

    it('should throw and log when verification fails', async () => {
      const token = 'invalid_token';
      const error = new Error('Invalid token');

      configService.get.mockReturnValue('refresh_secret');
      jwtService.verifyAsync.mockRejectedValue(error);

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(error);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { error },
        'Refresh token verification failed',
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return access token payload', async () => {
      const token = 'access_token';
      const payload = {
        email: 'test@example.com',
        sub: 1,
        id: 1,
        role: 'COLLABORATOR',
        tokenVersion: 1,
        jti: 'access_jti',
      };

      configService.get.mockReturnValue('access_secret');
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyAccessToken(token);

      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'access_secret',
      });
    });

    it('should throw and log when verification fails', async () => {
      const token = 'invalid_token';
      const error = new Error('Invalid token');

      configService.get.mockReturnValue('access_secret');
      jwtService.verifyAsync.mockRejectedValue(error);

      await expect(service.verifyAccessToken(token)).rejects.toThrow(error);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { error },
        'Access token verification failed',
      );
    });
  });

  describe('getAccessTokenJti', () => {
    it('should extract JTI from valid token', () => {
      const token = 'valid_token';
      const decodedPayload = { jti: 'test_jti', sub: 1 };

      jwtService.decode.mockReturnValue(decodedPayload);

      const result = service.getAccessTokenJti(token);

      expect(result).toBe('test_jti');
      expect(jwtService.decode).toHaveBeenCalledWith(token);
    });

    it('should return null when token has no JTI', () => {
      const token = 'token_without_jti';
      const decodedPayload = { sub: 1 }; // No jti field

      jwtService.decode.mockReturnValue(decodedPayload);

      const result = service.getAccessTokenJti(token);

      expect(result).toBeNull();
    });

    it('should return null when decode fails', () => {
      const token = 'invalid_token';

      jwtService.decode.mockImplementation(() => {
        throw new Error('Decode failed');
      });

      const result = service.getAccessTokenJti(token);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Failed to decode token for jti extraction',
      );
    });

    it('should return null when token decodes to null', () => {
      const token = 'empty_token';

      jwtService.decode.mockReturnValue(null);

      const result = service.getAccessTokenJti(token);

      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromAuthHeader', () => {
    it('should extract token from Bearer authorization header', () => {
      const authHeader = 'Bearer my_token_here';

      const result = service.extractTokenFromAuthHeader(authHeader);

      expect(result).toBe('my_token_here');
    });

    it('should return undefined for non-Bearer headers', () => {
      const authHeader = 'Basic dXNlcjpwYXNz';

      const result = service.extractTokenFromAuthHeader(authHeader);

      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined auth header', () => {
      const result = service.extractTokenFromAuthHeader(undefined);

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty auth header', () => {
      const result = service.extractTokenFromAuthHeader('');

      expect(result).toBeUndefined();
    });
  });

  describe('getTokenExpiry', () => {
    it('should extract expiry time from valid token', () => {
      const token = 'valid_token';
      const exp = 1640995200; // Example timestamp
      const decodedPayload = { exp, sub: 1 };

      jwtService.decode.mockReturnValue(decodedPayload);

      const result = service.getTokenExpiry(token);

      expect(result).toBe(exp * 1000); // Should convert to milliseconds
    });

    it('should return null when token has no expiry', () => {
      const token = 'token_without_exp';
      const decodedPayload = { sub: 1 }; // No exp field

      jwtService.decode.mockReturnValue(decodedPayload);

      const result = service.getTokenExpiry(token);

      expect(result).toBeNull();
    });

    it('should return null when decode fails', () => {
      const token = 'invalid_token';

      jwtService.decode.mockImplementation(() => {
        throw new Error('Decode failed');
      });

      const result = service.getTokenExpiry(token);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Failed to decode token for expiry extraction',
      );
    });

    it('should return null when token decodes to null', () => {
      const token = 'empty_token';

      jwtService.decode.mockReturnValue(null);

      const result = service.getTokenExpiry(token);

      expect(result).toBeNull();
    });

    it('should return null when exp is not a number', () => {
      const token = 'token_with_invalid_exp';
      const decodedPayload = { exp: 'invalid', sub: 1 };

      jwtService.decode.mockReturnValue(decodedPayload);

      const result = service.getTokenExpiry(token);

      expect(result).toBeNull();
    });
  });
});