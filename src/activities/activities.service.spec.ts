import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FilterActivitiesDto } from './dto/filter-activities.dto';
import { ActivityType } from '@prisma/client';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const mockPrismaService = {
    city: {
      findUnique: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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
        ActivitiesService,
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

    service = module.get<ActivitiesService>(ActivitiesService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateActivityDto = {
      name: 'Test Activity',
      description: 'Test Description',
      type: ActivityType.CULTURE,
      tags: ['test'],
      cityId: 'city-id',
    };

    const mockCity = {
      id: 'city-id',
      name: 'Test City',
    };

    const mockActivity = {
      id: 'activity-id',
      ...createDto,
      city: mockCity,
    };

    it('should create an activity successfully', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(mockCity);
      mockPrismaService.activity.create.mockResolvedValue(mockActivity);

      const result = await service.create(createDto);

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.city.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.cityId },
      });
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if city does not exist', async () => {
      mockPrismaService.city.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const filters: FilterActivitiesDto = {
      cityId: 'city-id',
      page: 1,
      limit: 20,
    };

    const mockActivities = [
      {
        id: 'activity-1',
        name: 'Activity 1',
        city: { id: 'city-id', name: 'City' },
      },
    ];

    it('should return activities from cache if available', async () => {
      const cachedResult = {
        data: mockActivities,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(filters);

      expect(result).toEqual(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockPrismaService.activity.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.activity.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(mockPrismaService.activity.findMany).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const activityId = 'activity-id';
    const mockActivity = {
      id: activityId,
      name: 'Test Activity',
      city: { id: 'city-id', name: 'City' },
    };

    it('should return activity from cache if available', async () => {
      mockCacheService.get.mockResolvedValue(mockActivity);

      const result = await service.findOne(activityId);

      expect(result).toEqual(mockActivity);
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockPrismaService.activity.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);

      const result = await service.findOne(activityId);

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activity.findUnique).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if activity does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.findOne(activityId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const activityId = 'activity-id';
    const updateDto: UpdateActivityDto = {
      name: 'Updated Activity',
    };

    const mockActivity = {
      id: activityId,
      name: 'Original Activity',
      cityId: 'city-id',
    };

    const updatedActivity = {
      ...mockActivity,
      ...updateDto,
      city: { id: 'city-id', name: 'City' },
    };

    it('should update activity successfully', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.activity.update.mockResolvedValue(updatedActivity);

      const result = await service.update(activityId, updateDto);

      expect(result).toEqual(updatedActivity);
      expect(mockPrismaService.activity.update).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if activity does not exist', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.update(activityId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const activityId = 'activity-id';
    const mockActivity = {
      id: activityId,
      name: 'Test Activity',
      cityId: 'city-id',
    };

    it('should mark activity as inactive', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.activity.update.mockResolvedValue({
        ...mockActivity,
        isActive: false,
      });

      const result = await service.remove(activityId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: activityId },
        data: { isActive: false },
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if activity does not exist', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.remove(activityId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

