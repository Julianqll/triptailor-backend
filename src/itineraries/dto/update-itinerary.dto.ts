import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class UpdateItineraryDto {
  @ApiProperty({
    description: 'Título del itinerario',
    required: false,
    example: 'Mi viaje a Cusco',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descripción del itinerario',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Lista de intereses',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}

