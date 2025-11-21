import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FilterActivitiesDto } from './dto/filter-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityDto: CreateActivityDto) {
    // Verificar que la ciudad existe
    const city = await this.prisma.city.findUnique({
      where: { id: createActivityDto.cityId },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${createActivityDto.cityId} no encontrada`);
    }

    return this.prisma.activity.create({
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
  }

  async findAll(filters: FilterActivitiesDto) {
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

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
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

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    return this.prisma.activity.update({
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
  }

  async remove(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    // Marcar como inactiva en lugar de eliminar
    return this.prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

