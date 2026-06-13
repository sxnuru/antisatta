import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('market/:marketId')
  @ApiOperation({ summary: 'Get threaded comments for a market' })
  async getByMarket(@Param('marketId') marketId: string, @Query() pagination: PaginationDto) {
    return this.commentsService.getByMarket(marketId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a comment or reply' })
  async create(@CurrentUser() user: any, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete own comment' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle like on a comment' })
  async toggleLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.toggleLike(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Report a comment' })
  async report(@Param('id') id: string, @CurrentUser() user: any, @Body('reason') reason: string) {
    return this.commentsService.report(id, user.id, reason);
  }
}
