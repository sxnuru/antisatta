import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard with filters' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly', 'all-time'], required: false })
  @ApiQuery({ name: 'sortBy', enum: ['roi', 'profit', 'winRate'], required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async get(
    @Query('period') period: string = 'all-time',
    @Query('sortBy') sortBy: string = 'roi',
    @Query('limit') limit: number = 50,
  ) {
    return this.leaderboardService.get(period, sortBy, limit);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Daily leaderboard' })
  async getDaily(@Query('sortBy') sortBy: string = 'roi', @Query('limit') limit: number = 50) {
    return this.leaderboardService.get('daily', sortBy, limit);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Weekly leaderboard' })
  async getWeekly(@Query('sortBy') sortBy: string = 'roi', @Query('limit') limit: number = 50) {
    return this.leaderboardService.get('weekly', sortBy, limit);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Monthly leaderboard' })
  async getMonthly(@Query('sortBy') sortBy: string = 'roi', @Query('limit') limit: number = 50) {
    return this.leaderboardService.get('monthly', sortBy, limit);
  }

  @Get('all-time')
  @ApiOperation({ summary: 'All-time leaderboard' })
  async getAllTime(@Query('sortBy') sortBy: string = 'roi', @Query('limit') limit: number = 50) {
    return this.leaderboardService.get('all-time', sortBy, limit);
  }
}
