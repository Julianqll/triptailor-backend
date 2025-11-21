import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '@prisma/client';

export class FilterActivitiesDto {
  @ApiProperty({ description: 'ID de la ciudad', required: false })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiProperty({
    description: 'Tipo de actividad',
    enum: ActivityType,
    required: false,
  })
  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

  @ApiProperty({
    description: 'Tag para filtrar (puede repetirse)',
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Precio mínimo en USD', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ description: 'Precio máximo en USD', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ description: 'Número de página', required: false, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Límite de resultados por página', required: false, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

