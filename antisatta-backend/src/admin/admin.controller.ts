import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResolveMarketDto } from '../markets/dto/resolve-market.dto';

@ApiTags('Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard analytics' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  async getUsers(@Query() pagination: PaginationDto) {
    return this.adminService.getUsers(pagination);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban or unban a user' })
  async toggleBan(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.toggleBan(id, reason);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  async changeRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.changeRole(id, role);
  }

  @Get('markets')
  @ApiOperation({ summary: 'List all markets (any status)' })
  async getMarkets(@Query() pagination: PaginationDto) {
    return this.adminService.getMarkets(pagination);
  }

  @Patch('markets/:id/approve')
  @ApiOperation({ summary: 'Approve a pending market' })
  async approveMarket(@Param('id') id: string) {
    return this.adminService.approveMarket(id);
  }

  @Patch('markets/:id/reject')
  @ApiOperation({ summary: 'Reject a pending market' })
  async rejectMarket(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectMarket(id, reason);
  }

  @Patch('markets/:id/resolve')
  @ApiOperation({ summary: 'Resolve a market (set winning outcome)' })
  async resolveMarket(@Param('id') id: string, @Body() dto: ResolveMarketDto) {
    return this.adminService.resolveMarket(id, dto.winningOutcomeId);
  }

  @Patch('markets/:id/cancel')
  @ApiOperation({ summary: 'Cancel a market and refund all predictions' })
  async cancelMarket(@Param('id') id: string) {
    return this.adminService.cancelMarket(id);
  }

  @Patch('markets/:id/feature')
  @ApiOperation({ summary: 'Toggle featured flag on a market' })
  async toggleFeature(@Param('id') id: string) {
    return this.adminService.toggleFeature(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View audit logs' })
  async getAuditLogs(@Query() pagination: PaginationDto) {
    return this.adminService.getAuditLogs(pagination);
  }
}
