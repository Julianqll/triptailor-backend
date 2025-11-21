import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ description: 'Nombre de la actividad', example: 'Visita a Machu Picchu' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descripción de la actividad' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Tipo de actividad',
    enum: ActivityType,
    example: ActivityType.CULTURE,
  })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({
    description: 'Tags de la actividad',
    example: ['cultura', 'historia', 'arqueología'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: 'Precio aproximado en USD', required: false })
  @IsInt()
  @IsOptional()
  approxPrice?: number;

  @ApiProperty({ description: 'Ubicación o dirección', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Duración en minutos', required: false })
  @IsInt()
  @IsOptional()
  durationMin?: number;

  @ApiProperty({ description: 'Hora de inicio (formato HH:mm)', required: false, example: '09:00' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Hora de fin (formato HH:mm)', required: false, example: '18:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'ID de la ciudad', example: 'cusco-peru' })
  @IsString()
  cityId: string;
}

