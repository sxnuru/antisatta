import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PredictionsService } from './predictions.service';
import { PlacePredictionDto } from './dto/place-prediction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Place a prediction on a market outcome' })
  async place(@CurrentUser() user: any, @Body() dto: PlacePredictionDto) {
    return this.predictionsService.place(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own active predictions' })
  async getActive(@CurrentUser() user: any) {
    return this.predictionsService.getActive(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own prediction history' })
  async getHistory(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.predictionsService.getHistory(user.id, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get prediction details' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.predictionsService.findOne(id, user.id);
  }
}
