import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get public profile by username
   */
  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        roi: true,
        wins: true,
        losses: true,
        marketsCreated: true,
        predictionsWon: true,
        predictionsLost: true,
        createdAt: true,
        balance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate win rate
    const totalPredictions = user.predictionsWon + user.predictionsLost;
    const winRate = totalPredictions > 0 
      ? (user.predictionsWon / totalPredictions) * 100 
      : 0;

    // Calculate dynamic ROI based on starting balance of 1000
    const profit = user.balance - 1000;
    const accountRoi = (profit / 1000) * 100;

    return {
      ...user,
      roi: Number(accountRoi.toFixed(2)),
      winRate: Number(winRate.toFixed(2)),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // If updating username, check for uniqueness
    if (dto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username && { username: dto.username }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        role: true,
      },
    });

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ConflictException('Incorrect current password');
    }

    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Get user's prediction history (paginated)
   */
  async getUserPredictions(userId: string, pagination: PaginationDto) {
    const { skip, take } = pagination;

    const [total, data] = await Promise.all([
      this.prisma.prediction.count({ where: { userId } }),
      this.prisma.prediction.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          market: {
            select: { id: true, title: true, status: true, resolvedAt: true },
          },
          outcome: {
            select: { id: true, name: true, probability: true, isWinner: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: skip > 0,
      },
    };
  }

  /**
   * Get markets created by user (paginated)
   */
  async getUserMarkets(userId: string, pagination: PaginationDto) {
    const { skip, take } = pagination;

    const [total, data] = await Promise.all([
      this.prisma.market.count({ where: { creatorId: userId } }),
      this.prisma.market.findMany({
        where: { creatorId: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          outcomes: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: skip > 0,
      },
    };
  }
}
