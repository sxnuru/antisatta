import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MarketStatus, MarketType, MarketCategory } from '@prisma/client';
import { Transform } from 'class-transformer';

export class MarketFilterDto {
  @ApiPropertyOptional({ enum: MarketStatus })
  @IsOptional()
  @IsEnum(MarketStatus)
  status?: MarketStatus;

  @ApiPropertyOptional({ enum: MarketType })
  @IsOptional()
  @IsEnum(MarketType)
  type?: MarketType;

  @ApiPropertyOptional({ enum: MarketCategory })
  @IsOptional()
  @IsEnum(MarketCategory)
  category?: MarketCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  featured?: boolean;
}
