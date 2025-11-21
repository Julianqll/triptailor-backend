import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FilterActivitiesDto } from './dto/filter-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  private generateCacheKey(filters: FilterActivitiesDto): string {
    const parts = [
      'activities',
      filters.cityId || 'all',
      filters.type || 'all',
      filters.tags?.join(',') || 'all',
      filters.minPrice || '0',
      filters.maxPrice || '999999',
      filters.page || '1',
      filters.limit || '20',
    ];
    return parts.join(':');
  }

  async create(createActivityDto: CreateActivityDto) {
    // Verificar que la ciudad existe
    const city = await this.prisma.city.findUnique({
      where: { id: createActivityDto.cityId },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${createActivityDto.cityId} no encontrada`);
    }

    const activity = await this.prisma.activity.create({
      data: createActivityDto,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
    });

    // Nota: La invalidación de cache con wildcards no es soportada directamente
    // El cache expirará automáticamente después del TTL configurado

    return activity;
  }

  async findAll(filters: FilterActivitiesDto) {
    // Generar clave de cache
    const cacheKey = this.generateCacheKey(filters);

    // Intentar obtener del cache
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      cityId,
      type,
      tags,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (cityId) {
      where.cityId = cityId;
    }

    if (type) {
      where.type = type;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.approxPrice = {};
      if (minPrice !== undefined) {
        where.approxPrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.approxPrice.lte = maxPrice;
      }
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        include: {
          city: {
            select: {
              id: true,
              name: true,
              country: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    const result = {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Guardar en cache (5 minutos por defecto)
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string) {
    const cacheKey = `activity:${id}`;

    // Intentar obtener del cache
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    // Guardar en cache (5 minutos)
    await this.cacheService.set(cacheKey, activity, 300);

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: updateActivityDto,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
    });

    // Invalidar cache de la actividad específica
    await this.cacheService.del(`activity:${id}`);
    // Nota: El cache de listados expirará automáticamente después del TTL

    return updated;
  }

  async remove(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    // Marcar como inactiva en lugar de eliminar
    const updated = await this.prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidar cache de la actividad específica
    await this.cacheService.del(`activity:${id}`);
    // Nota: El cache de listados expirará automáticamente después del TTL

    return updated;
  }
}

