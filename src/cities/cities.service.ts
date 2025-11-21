import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.city.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activities: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada`);
    }

    return city;
  }
}

