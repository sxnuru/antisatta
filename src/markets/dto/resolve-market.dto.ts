import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveMarketDto {
  @ApiProperty({ description: 'UUID of the winning outcome' })
  @IsUUID()
  winningOutcomeId: string;
}
