import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('profile/:username')
  @ApiOperation({ summary: 'Get public profile by username' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your profile' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Put('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change your password' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get('predictions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get your prediction history' })
  async getPredictions(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.usersService.getUserPredictions(userId, pagination);
  }

  @Get('markets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get markets created by you' })
  async getMarkets(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.usersService.getUserMarkets(userId, pagination);
  }
}
