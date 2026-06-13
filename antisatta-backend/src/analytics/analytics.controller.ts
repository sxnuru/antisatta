import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform overview stats' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('markets')
  @ApiOperation({ summary: 'Market performance analytics' })
  async getMarketAnalytics() {
    return this.analyticsService.getMarketAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'User growth analytics' })
  async getUserAnalytics() {
    return this.analyticsService.getUserAnalytics();
  }
}
