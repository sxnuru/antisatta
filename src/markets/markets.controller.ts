import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { MarketFilterDto } from './dto/market-filter.dto';
import { ResolveMarketDto } from './dto/resolve-market.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Markets')
@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  @ApiOperation({ summary: 'List markets with filters and pagination' })
  async findAll(@Query() filter: MarketFilterDto, @Query() pagination: PaginationDto) {
    return this.marketsService.findAll(filter, pagination);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending markets' })
  async getTrending() {
    return this.marketsService.getTrending();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured markets' })
  async getFeatured() {
    return this.marketsService.getFeatured();
  }

  @Get('live')
  @ApiOperation({ summary: 'Get live FIFA match markets' })
  async getLive() {
    return this.marketsService.getLiveMatches();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming FIFA match markets' })
  async getUpcoming() {
    return this.marketsService.getUpcoming();
  }

  @Get('resolved')
  @ApiOperation({ summary: 'Get resolved/concluded FIFA match markets with results' })
  async getResolved() {
    return this.marketsService.getResolved();
  }

  @Get('community')
  @ApiOperation({ summary: 'Get community-created markets' })
  async getCommunity(@Query() pagination: PaginationDto) {
    return this.marketsService.getCommunity(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get market details with outcomes' })
  async findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new market' })
  async create(@CurrentUser() user: any, @Body() dto: CreateMarketDto) {
    return this.marketsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own market (draft only)' })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateMarketDto) {
    return this.marketsService.update(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete own market (draft only)' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.marketsService.remove(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/resolve')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Resolve a custom market (Creator only)' })
  async resolve(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ResolveMarketDto,
  ) {
    const market = await this.marketsService.findOne(id);
    if (market.creatorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only the creator or admin can resolve this market');
    }
    return this.marketsService.resolveMarket(id, dto.winningOutcomeId);
  }

  @Get(':id/predictions')
  @ApiOperation({ summary: 'Get prediction activity for a market' })
  async getMarketPredictions(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.marketsService.getMarketPredictions(id, pagination);
  }
}
