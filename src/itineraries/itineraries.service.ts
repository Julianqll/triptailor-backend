import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { FilterItinerariesDto } from './dto/filter-itineraries.dto';
import { ActivityType } from '@prisma/client';

@Injectable()
export class ItinerariesService {
  constructor(private prisma: PrismaService) {}

  // Mapeo de intereses (strings) a tipos de actividad
  private mapInterestToActivityType(interest: string): ActivityType | null {
    const interestLower = interest.toLowerCase();
    if (interestLower.includes('gastronom') || interestLower.includes('comida')) {
      return ActivityType.GASTRONOMY;
    }
    if (interestLower.includes('aventura') || interestLower.includes('deporte')) {
      return ActivityType.ADVENTURE;
    }
    if (interestLower.includes('cultura') || interestLower.includes('historia') || interestLower.includes('museo')) {
      return ActivityType.CULTURE;
    }
    if (interestLower.includes('noche') || interestLower.includes('discoteca') || interestLower.includes('bar')) {
      return ActivityType.NIGHTLIFE;
    }
    if (interestLower.includes('relax') || interestLower.includes('spa') || interestLower.includes('descanso')) {
      return ActivityType.RELAX;
    }
    return null;
  }

  async generate(userId: string, generateDto: GenerateItineraryDto) {
    const { cityId, startDate, endDate, interests, budgetApprox } = generateDto;

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (start < new Date()) {
      throw new BadRequestException('La fecha de inicio no puede ser en el pasado');
    }

    // Verificar que la ciudad existe
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${cityId} no encontrada`);
    }

    // Calcular número de días
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff > 14) {
      throw new BadRequestException('El itinerario no puede exceder 14 días');
    }

    // Buscar actividades que coincidan con los intereses
    const activityTypes = interests
      .map((interest) => this.mapInterestToActivityType(interest))
      .filter((type) => type !== null) as ActivityType[];

    const interestTags = interests.map((i) => i.toLowerCase());

    const whereClause: any = {
      cityId,
      isActive: true,
    };

    // Filtrar por tipo de actividad o tags
    if (activityTypes.length > 0 || interestTags.length > 0) {
      whereClause.OR = [];

      if (activityTypes.length > 0) {
        whereClause.OR.push({
          type: { in: activityTypes },
        });
      }

      if (interestTags.length > 0) {
        whereClause.OR.push({
          tags: { hasSome: interestTags },
        });
      }
    }

    // Filtrar por presupuesto si se proporciona
    if (budgetApprox) {
      const avgBudgetPerDay = budgetApprox / daysDiff;
      whereClause.approxPrice = {
        lte: avgBudgetPerDay * 2, // Permitir actividades hasta 2x el promedio diario
      };
    }

    const availableActivities = await this.prisma.activity.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (availableActivities.length === 0) {
      throw new NotFoundException(
        'No se encontraron actividades que coincidan con los intereses especificados',
      );
    }

    // Crear el itinerario
    const itinerary = await this.prisma.itinerary.create({
      data: {
        title: `Itinerario ${city.name} - ${start.toLocaleDateString()}`,
        description: `Itinerario generado para ${daysDiff} días en ${city.name}`,
        startDate: start,
        endDate: end,
        interests,
        budgetApprox,
        userId,
        cityId,
      },
    });

    // Distribuir actividades entre los días
    const activitiesPerDay = Math.min(
      Math.ceil(availableActivities.length / daysDiff),
      4, // Máximo 4 actividades por día
    );

    const days: any[] = [];
    let activityIndex = 0;

    for (let dayNum = 1; dayNum <= daysDiff; dayNum++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + dayNum - 1);

      const day = await this.prisma.itineraryDay.create({
        data: {
          dayNumber: dayNum,
          date: dayDate,
          itineraryId: itinerary.id,
        },
      });

      // Asignar actividades a este día
      const dayActivities = availableActivities.slice(
        activityIndex,
        activityIndex + activitiesPerDay,
      );

      // Mezclar tipos de actividad para variedad
      const shuffled = [...dayActivities].sort(() => Math.random() - 0.5);
      const selectedActivities = shuffled.slice(0, Math.min(activitiesPerDay, shuffled.length));

      for (const activity of selectedActivities) {
        let startTime = activity.startTime || '09:00';
        let endTime = activity.endTime;

        if (!endTime && activity.durationMin) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + activity.durationMin;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        }

        await this.prisma.itineraryActivity.create({
          data: {
            dayId: day.id,
            activityId: activity.id,
            startTime: startTime,
            endTime: endTime || undefined,
          },
        });
      }

      activityIndex += activitiesPerDay;

      days.push(day);
    }

    // Retornar el itinerario completo
    return this.findOne(userId, itinerary.id);
  }

  async findAll(userId: string, filters: FilterItinerariesDto) {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const [itineraries, total] = await Promise.all([
      this.prisma.itinerary.findMany({
        where: {
          userId,
        },
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
          _count: {
            select: {
              days: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.itinerary.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      data: itineraries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            timezone: true,
          },
        },
        days: {
          orderBy: {
            dayNumber: 'asc',
          },
          include: {
            activities: {
              include: {
                activity: {
                  include: {
                    city: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerario con ID ${id} no encontrado`);
    }

    // Verificar que el itinerario pertenece al usuario
    if (itinerary.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a este itinerario');
    }

    return itinerary;
  }

  async update(userId: string, id: string, updateDto: UpdateItineraryDto) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerario con ID ${id} no encontrado`);
    }

    if (itinerary.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar este itinerario');
    }

    return this.prisma.itinerary.update({
      where: { id },
      data: updateDto,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
        days: {
          orderBy: {
            dayNumber: 'asc',
          },
          include: {
            activities: {
              include: {
                activity: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerario con ID ${id} no encontrado`);
    }

    if (itinerary.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este itinerario');
    }

    // Eliminar el itinerario (cascade eliminará los días y actividades)
    await this.prisma.itinerary.delete({
      where: { id },
    });

    return { message: 'Itinerario eliminado exitosamente' };
  }
}

