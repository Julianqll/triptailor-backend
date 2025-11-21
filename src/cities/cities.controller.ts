import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CitiesService } from './cities.service';

@Controller('cities')
@ApiTags('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las ciudades activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciudades activas',
  })
  async findAll() {
    return this.citiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una ciudad' })
  @ApiParam({ name: 'id', description: 'ID de la ciudad' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la ciudad',
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }
}

