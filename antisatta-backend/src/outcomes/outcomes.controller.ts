import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OutcomesService } from './outcomes.service';

@ApiTags('Markets')
@Controller('outcomes')
export class OutcomesController {
  constructor(private readonly outcomesService: OutcomesService) {}

  @Get('market/:marketId')
  @ApiOperation({ summary: 'Get outcomes for a market' })
  async getByMarket(@Param('marketId') marketId: string) {
    return this.outcomesService.getByMarket(marketId);
  }
}
