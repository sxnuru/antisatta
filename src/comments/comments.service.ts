import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async getByMarket(marketId: string, pagination: PaginationDto) {
    const { skip, take } = pagination;
    const [total, data] = await Promise.all([
      this.prisma.comment.count({ where: { marketId, parentId: null } }),
      this.prisma.comment.findMany({
        where: { marketId, parentId: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          replies: {
            include: { user: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    ]);
    return { data, meta: { total, page: pagination.page || 1, limit: take, totalPages: Math.ceil(total / take), hasNext: skip + take < total, hasPrev: skip > 0 } };
  }

  async create(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        marketId: dto.marketId,
        userId,
        content: dto.content,
        parentId: dto.parentId
      },
      include: {
        user: { select: { id: true, username: true } }
      }
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment');
    
    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }

  async toggleLike(id: string, userId: string) {
    const existing = await this.prisma.commentLike.findUnique({ where: { commentId_userId: { commentId: id, userId } } });
    if (existing) {
      await this.prisma.commentLike.delete({ where: { id: existing.id } });
      await this.prisma.comment.update({ where: { id }, data: { likesCount: { decrement: 1 } } });
      return { success: true, liked: false };
    } else {
      await this.prisma.commentLike.create({ data: { commentId: id, userId } });
      await this.prisma.comment.update({ where: { id }, data: { likesCount: { increment: 1 } } });
      return { success: true, liked: true };
    }
  }

  async report(id: string, userId: string, reason: string) {
    // In a real implementation this would flag the comment and create an admin review task
    return { success: true, message: 'Comment reported' };
  }
}
