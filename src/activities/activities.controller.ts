import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FilterActivitiesDto } from './dto/filter-activities.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activities')
@ApiTags('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear una nueva actividad (requiere autenticación)' })
  @ApiResponse({
    status: 201,
    description: 'Actividad creada exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar actividades con filtros opcionales' })
  @ApiResponse({
    status: 200,
    description: 'Lista de actividades con paginación',
  })
  findAll(@Query() filters: FilterActivitiesDto) {
    return this.activitiesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una actividad' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la actividad',
  })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar una actividad (requiere autenticación)' })
  @ApiResponse({
    status: 200,
    description: 'Actividad actualizada exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar (desactivar) una actividad (requiere autenticación)' })
  @ApiResponse({
    status: 200,
    description: 'Actividad desactivada exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}

