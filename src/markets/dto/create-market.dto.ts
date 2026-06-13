import { IsString, IsEnum, IsArray, ValidateNested, IsDateString, IsOptional, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketCategory } from '@prisma/client';

class OutcomeDto {
  @ApiProperty({ example: 'Argentina Win' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
}

export class CreateMarketDto {
  @ApiProperty({ example: 'Argentina vs Brazil — FIFA World Cup 2026' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Predict the outcome of the Argentina vs Brazil match' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: MarketCategory })
  @IsEnum(MarketCategory)
  category: MarketCategory;

  @ApiPropertyOptional({ example: 'Official FIFA Results' })
  @IsOptional()
  @IsString()
  resolutionSource?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/banner.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ type: [OutcomeDto], minItems: 2, maxItems: 10 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => OutcomeDto)
  outcomes: OutcomeDto[];

  @ApiPropertyOptional({ example: '2026-07-15T20:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ example: '2026-07-15T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;
}
