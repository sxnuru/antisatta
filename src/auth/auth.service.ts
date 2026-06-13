import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TOKEN_ECONOMY } from '../common/constants/token-economy';
import { AuditAction, RewardType } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto, ipAddress: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException('Username already taken');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Use transaction to create user and audit log
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          passwordHash,
          balance: TOKEN_ECONOMY.SIGNUP_BONUS,
        },
      });

      // 2. Initial signup reward
      await tx.reward.create({
        data: {
          userId: user.id,
          type: RewardType.SIGNUP_BONUS,
          amount: TOKEN_ECONOMY.SIGNUP_BONUS,
          description: 'Welcome bonus',
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.REGISTER,
          ipAddress,
        },
      });

      return user;
    });

    // Return tokens
    const tokens = await this.generateTokens(result.id, result.email, result.role);
    return {
      user: this.sanitizeUser(result),
      tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.banned) {
      throw new UnauthorizedException(`Account suspended: ${user.banReason || 'Violation of terms'}`);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginDate: new Date() },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.LOGIN,
        ipAddress,
        userAgent,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Logout user by revoking all their refresh tokens
   */
  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.LOGOUT,
      },
    });

    return { success: true };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revoked) {
      // Token reuse detected - revoke all tokens for this family
      await this.prisma.refreshToken.updateMany({
        where: { family: tokenRecord.family },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Token reuse detected. Please login again.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.banned) {
      throw new UnauthorizedException('User not found or banned');
    }

    // Revoke the used token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    // Generate new token pair using same family
    return this.generateTokens(user.id, user.email, user.role, tokenRecord.family);
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // ── Helper Methods ──────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string, existingFamily?: string) {
    const payload = { sub: userId, email, role };
    const family = existingFamily || uuidv4();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(
        { sub: userId, family },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    // Store refresh token
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
