import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all achievements' })
  async findAll() {
    return this.achievementsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get current user's achievements" })
  async getUserAchievements(@CurrentUser() user: any) {
    return this.achievementsService.getUserAchievements(user.id);
  }
}
