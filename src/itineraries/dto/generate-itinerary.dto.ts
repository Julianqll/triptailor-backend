import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, IsInt, IsOptional, Min, ArrayMinSize } from 'class-validator';

export class GenerateItineraryDto {
  @ApiProperty({
    description: 'ID de la ciudad',
    example: 'cusco-peru',
  })
  @IsString()
  cityId: string;

  @ApiProperty({
    description: 'Fecha de inicio del itinerario (ISO 8601)',
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin del itinerario (ISO 8601)',
    example: '2024-06-05T00:00:00.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Lista de intereses del usuario',
    example: ['gastronomía', 'aventura', 'cultura'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  interests: string[];

  @ApiProperty({
    description: 'Presupuesto aproximado en USD',
    required: false,
    example: 1000,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  budgetApprox?: number;
}

