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
} from '@nestjs/swagger';
import { ItinerariesService } from './itineraries.service';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { FilterItinerariesDto } from './dto/filter-itineraries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('itineraries')
@ApiTags('itineraries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generar un nuevo itinerario basado en preferencias' })
  @ApiResponse({
    status: 201,
    description: 'Itinerario generado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Ciudad o actividades no encontradas' })
  async generate(
    @CurrentUser() user: any,
    @Body() generateDto: GenerateItineraryDto,
  ) {
    return this.itinerariesService.generate(user.id, generateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar itinerarios del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de itinerarios con paginación',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@CurrentUser() user: any, @Query() filters: FilterItinerariesDto) {
    return this.itinerariesService.findAll(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un itinerario' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del itinerario con días y actividades',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para acceder a este itinerario' })
  @ApiResponse({ status: 404, description: 'Itinerario no encontrado' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.itinerariesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un itinerario' })
  @ApiResponse({
    status: 200,
    description: 'Itinerario actualizado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para actualizar este itinerario' })
  @ApiResponse({ status: 404, description: 'Itinerario no encontrado' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateItineraryDto,
  ) {
    return this.itinerariesService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un itinerario' })
  @ApiResponse({
    status: 200,
    description: 'Itinerario eliminado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para eliminar este itinerario' })
  @ApiResponse({ status: 404, description: 'Itinerario no encontrado' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.itinerariesService.remove(user.id, id);
  }
}

