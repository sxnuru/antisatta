import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TOKEN_ECONOMY } from '../../common/constants/token-economy';

export class PlacePredictionDto {
  @ApiProperty({ description: 'Market ID' })
  @IsUUID()
  marketId: string;

  @ApiProperty({ description: 'Outcome ID to predict' })
  @IsUUID()
  outcomeId: string;

  @ApiProperty({ example: 100, minimum: 10, maximum: 5000 })
  @IsInt()
  @Min(TOKEN_ECONOMY.MIN_STAKE)
  @Max(TOKEN_ECONOMY.MAX_STAKE)
  stake: number;
}
