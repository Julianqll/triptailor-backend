import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CitiesService', () => {
  let service: CitiesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    city: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CitiesService>(CitiesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const mockCities = [
      {
        id: 'city-1',
        name: 'City 1',
        country: 'Country 1',
        isActive: true,
      },
      {
        id: 'city-2',
        name: 'City 2',
        country: 'Country 2',
        isActive: true,
      },
    ];

    it('should return all active cities', async () => {
      mockPrismaService.city.findMany.mockResolvedValue(mockCities);

      const result = await service.findAll();

      expect(result).toEqual(mockCities);
      expect(mockPrismaService.city.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    const cityId = 'city-id';
    const mockCity = {
      id: cityId,
      name: 'Test City',
      country: 'Test Country',
      _count: {
        activities: 5,
      },
    };

    it('should return city details', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);

      const result = await service.findOne(cityId);

      expect(result).toEqual(mockCity);
      expect(mockPrismaService.city.findUnique).toHaveBeenCalledWith({
        where: { id: cityId },
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
    });

    it('should throw NotFoundException if city does not exist', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(null);

      await expect(service.findOne(cityId)).rejects.toThrow(NotFoundException);
    });
  });
});

