import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @ApiProperty({ description: 'Estado activo/inactivo', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

