import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ActivityType } from '@prisma/client';

describe('ItinerariesService', () => {
  let service: ItinerariesService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const mockPrismaService = {
    city: {
      findUnique: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    itinerary: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    itineraryDay: {
      create: jest.fn(),
    },
    itineraryActivity: {
      create: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItinerariesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ItinerariesService>(ItinerariesService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate - Validación de lógica de generación', () => {
    const userId = 'user-id';
    const futureStartDate = new Date();
    futureStartDate.setDate(futureStartDate.getDate() + 7);
    const futureEndDate = new Date(futureStartDate);
    futureEndDate.setDate(futureEndDate.getDate() + 2);

    const generateDto: GenerateItineraryDto = {
      cityId: 'city-id',
      startDate: futureStartDate.toISOString(),
      endDate: futureEndDate.toISOString(),
      interests: ['gastronomía', 'cultura'],
      budgetApprox: 1000,
    };

    const mockCity = {
      id: 'city-id',
      name: 'Test City',
    };

    const mockActivities = [
      {
        id: 'activity-1',
        name: 'Activity 1',
        type: ActivityType.GASTRONOMY,
        tags: ['gastronomía'],
        startTime: '09:00',
        durationMin: 120,
        approxPrice: 50,
      },
      {
        id: 'activity-2',
        name: 'Activity 2',
        type: ActivityType.CULTURE,
        tags: ['cultura'],
        startTime: '14:00',
        durationMin: 180,
        approxPrice: 30,
      },
      {
        id: 'activity-3',
        name: 'Activity 3',
        type: ActivityType.GASTRONOMY,
        tags: ['gastronomía'],
        startTime: '19:00',
        durationMin: 90,
        approxPrice: 80,
      },
    ];

    const mockItinerary = {
      id: 'itinerary-id',
      title: 'Test Itinerary',
      userId,
      cityId: generateDto.cityId,
      days: [],
    };

    it('should calculate correct number of days', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      await service.generate(userId, generateDto);

      // Verificar que se crearon 3 días (startDate + 2 días = 3 días totales)
      expect(mockPrismaService.itineraryDay.create).toHaveBeenCalledTimes(3);
    });

    it('should assign activities correctly to days', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      await service.generate(userId, generateDto);

      // Verificar que se asignaron actividades
      expect(mockPrismaService.itineraryActivity.create).toHaveBeenCalled();
    });

    it('should calculate endTime from startTime and duration', async () => {
      const activityWithDuration = {
        id: 'activity-1',
        name: 'Activity 1',
        type: ActivityType.GASTRONOMY,
        tags: ['gastronomía'],
        startTime: '09:00',
        durationMin: 120, // 2 horas
        approxPrice: 50,
      };

      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue([activityWithDuration]);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      await service.generate(userId, generateDto);

      // Verificar que se calculó el endTime correctamente (09:00 + 120 min = 11:00)
      expect(mockPrismaService.itineraryActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startTime: '09:00',
          endTime: '11:00',
        }),
      });
    });

    it('should map interests to activity types correctly', async () => {
      const gastronomyInterest = ['gastronomía'];
      const cultureInterest = ['cultura'];
      const adventureInterest = ['aventura'];

      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      // Test con intereses de gastronomía
      await service.generate(userId, {
        ...generateDto,
        interests: gastronomyInterest,
      });

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                type: { in: [ActivityType.GASTRONOMY] },
              }),
            ]),
          }),
        }),
      );
    });

    it('should validate date constraints', async () => {
      const invalidStartDate = new Date();
      invalidStartDate.setDate(invalidStartDate.getDate() - 1); // Ayer

      const invalidDto = {
        ...generateDto,
        startDate: invalidStartDate.toISOString(),
      };

      await expect(service.generate(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate itinerary duration limit (max 14 days)', async () => {
      const longStartDate = new Date();
      longStartDate.setDate(longStartDate.getDate() + 7);
      const longEndDate = new Date(longStartDate);
      longEndDate.setDate(longEndDate.getDate() + 15); // 15 días

      const invalidDto = {
        ...generateDto,
        startDate: longStartDate.toISOString(),
        endDate: longEndDate.toISOString(),
      };

      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);

      await expect(service.generate(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should filter activities by budget when provided', async () => {
      const budgetDto = {
        ...generateDto,
        budgetApprox: 100, // Presupuesto bajo
      };

      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      await service.generate(userId, budgetDto);

      // Verificar que se aplicó filtro de presupuesto
      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approxPrice: expect.any(Object),
          }),
        }),
      );
    });

    it('should ensure itinerary composition is valid (activities per day)', async () => {
      const manyActivities = Array.from({ length: 20 }, (_, i) => ({
        id: `activity-${i}`,
        name: `Activity ${i}`,
        type: ActivityType.CULTURE,
        tags: ['cultura'],
        startTime: '09:00',
        durationMin: 120,
        approxPrice: 50,
      }));

      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue(manyActivities);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      await service.generate(userId, generateDto);

      // Verificar que no se exceden 4 actividades por día
      const createCalls = mockPrismaService.itineraryActivity.create.mock.calls;
      const activitiesPerDay = Math.ceil(createCalls.length / 3); // 3 días
      expect(activitiesPerDay).toBeLessThanOrEqual(4);
    });

    it('should generate itinerary successfully', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.itinerary.create.mockResolvedValue(mockItinerary);
      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: mockItinerary.id,
      });
      mockPrismaService.itineraryActivity.create.mockResolvedValue({});
      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        city: mockCity,
        days: [],
      });

      const result = await service.generate(userId, generateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.itinerary.create).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw BadRequestException if startDate > endDate', async () => {
      const invalidStartDate = new Date();
      invalidStartDate.setDate(invalidStartDate.getDate() + 10);
      const invalidEndDate = new Date();
      invalidEndDate.setDate(invalidEndDate.getDate() + 5);

      const invalidDto = {
        ...generateDto,
        startDate: invalidStartDate.toISOString(),
        endDate: invalidEndDate.toISOString(),
      };

      await expect(service.generate(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if city does not exist', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureEndDate = new Date(futureDate);
      futureEndDate.setDate(futureEndDate.getDate() + 2);

      const testDto = {
        ...generateDto,
        startDate: futureDate.toISOString(),
        endDate: futureEndDate.toISOString(),
      };

      mockPrismaService.city.findUnique.mockResolvedValue(null);

      await expect(service.generate(userId, testDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if no activities found', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureEndDate = new Date(futureDate);
      futureEndDate.setDate(futureEndDate.getDate() + 2);

      const testDto = {
        ...generateDto,
        startDate: futureDate.toISOString(),
        endDate: futureEndDate.toISOString(),
      };

      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await expect(service.generate(userId, testDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    const userId = 'user-id';
    const filters = { page: 1, limit: 10 };

    const mockItineraries = [
      {
        id: 'itinerary-1',
        title: 'Itinerary 1',
        userId,
        city: { id: 'city-id', name: 'City' },
        _count: { days: 3 },
      },
    ];

    it('should return itineraries from cache if available', async () => {
      const cachedResult = {
        data: mockItineraries,
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(userId, filters);

      expect(result).toEqual(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockPrismaService.itinerary.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries);
      mockPrismaService.itinerary.count.mockResolvedValue(1);

      const result = await service.findAll(userId, filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const userId = 'user-id';
    const itineraryId = 'itinerary-id';

    const mockItinerary = {
      id: itineraryId,
      title: 'Test Itinerary',
      userId,
      city: { id: 'city-id', name: 'City' },
      days: [],
    };

    it('should return itinerary from cache if available', async () => {
      mockCacheService.get.mockResolvedValue(mockItinerary);

      const result = await service.findOne(userId, itineraryId);

      expect(result).toEqual(mockItinerary);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary);

      const result = await service.findOne(userId, itineraryId);

      expect(result).toEqual(mockItinerary);
      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if itinerary does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.itinerary.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, itineraryId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if itinerary belongs to another user', async () => {
      const otherUserItinerary = {
        ...mockItinerary,
        userId: 'other-user-id',
      };
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        otherUserItinerary,
      );

      await expect(service.findOne(userId, itineraryId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const userId = 'user-id';
    const itineraryId = 'itinerary-id';
    const updateDto: UpdateItineraryDto = {
      title: 'Updated Title',
    };

    const mockItinerary = {
      id: itineraryId,
      title: 'Original Title',
      userId,
    };

    it('should update itinerary successfully', async () => {
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary);
      mockPrismaService.itinerary.update.mockResolvedValue({
        ...mockItinerary,
        ...updateDto,
      });

      const result = await service.update(userId, itineraryId, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(mockPrismaService.itinerary.update).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if itinerary belongs to another user', async () => {
      const otherUserItinerary = {
        ...mockItinerary,
        userId: 'other-user-id',
      };
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        otherUserItinerary,
      );

      await expect(
        service.update(userId, itineraryId, updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const userId = 'user-id';
    const itineraryId = 'itinerary-id';

    const mockItinerary = {
      id: itineraryId,
      userId,
    };

    it('should delete itinerary successfully', async () => {
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary);
      mockPrismaService.itinerary.delete.mockResolvedValue(mockItinerary);

      const result = await service.remove(userId, itineraryId);

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.itinerary.delete).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if itinerary belongs to another user', async () => {
      const otherUserItinerary = {
        ...mockItinerary,
        userId: 'other-user-id',
      };
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        otherUserItinerary,
      );

      await expect(service.remove(userId, itineraryId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
