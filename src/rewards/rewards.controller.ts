import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('daily')
  @ApiOperation({ summary: 'Claim daily login reward' })
  async claimDaily(@CurrentUser() user: any) {
    return this.rewardsService.claimDaily(user.id);
  }

  @Post('recovery')
  @ApiOperation({ summary: 'Claim recovery tokens (balance must be 0)' })
  async claimRecovery(@CurrentUser() user: any) {
    return this.rewardsService.claimRecovery(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get reward history' })
  async getHistory(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.rewardsService.getHistory(user.id, pagination);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get current login streak info' })
  async getStreak(@CurrentUser() user: any) {
    return this.rewardsService.getStreak(user.id);
  }
}
