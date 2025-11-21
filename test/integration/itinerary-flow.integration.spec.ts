import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CacheService } from '../../src/cache/cache.service';
import * as bcrypt from 'bcrypt';

describe('Itinerary Flow Integration (Activities → Filter → Assign)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cacheService: CacheService;
  let authToken: string;
  let userId: string;
  let cityId: string;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    city: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    itinerary: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(CacheService)
      .useValue(mockCacheService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    cacheService = moduleFixture.get<CacheService>(CacheService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup: Crear usuario y obtener token
    const hashedPassword = await bcrypt.hash('password123', 10);
    userId = 'test-user-id';
    cityId = 'test-city-id';

    mockPrismaService.user.findUnique.mockResolvedValue({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPrismaService.user.create.mockResolvedValue({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock cache para que siempre retorne null (no cache)
    mockCacheService.get.mockResolvedValue(null);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.accessToken;
    } else {
      // Si el login falla, crear un token mock para las pruebas
      authToken = 'mock-token';
    }
  });

  describe('Flujo completo: Buscar actividades → Filtrar → Asignar al itinerario', () => {
    it('should complete full flow: search activities → filter → assign to itinerary', async () => {
      // 1. Buscar actividades disponibles
      const mockActivities = [
        {
          id: 'activity-1',
          name: 'Gastronomy Activity',
          description: 'Test description',
          type: 'GASTRONOMY',
          tags: ['gastronomía'],
          cityId,
          isActive: true,
          approxPrice: 50,
          location: 'Test Location',
          durationMin: 120,
          startTime: '09:00',
          endTime: '11:00',
          createdAt: new Date(),
          updatedAt: new Date(),
          city: {
            id: cityId,
            name: 'Test City',
            country: 'Test Country',
          },
        },
        {
          id: 'activity-2',
          name: 'Culture Activity',
          description: 'Test description',
          type: 'CULTURE',
          tags: ['cultura'],
          cityId,
          isActive: true,
          approxPrice: 30,
          location: 'Test Location',
          durationMin: 180,
          startTime: '14:00',
          endTime: '17:00',
          createdAt: new Date(),
          updatedAt: new Date(),
          city: {
            id: cityId,
            name: 'Test City',
            country: 'Test Country',
          },
        },
      ];

      // Mock para actividades con count
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities as any);
      mockPrismaService.activity.count.mockResolvedValue(2);

      // 2. Filtrar actividades por intereses (el endpoint no requiere auth)
      const activitiesResponse = await request(app.getHttpServer())
        .get('/api/activities')
        .query({ cityId, type: 'GASTRONOMY' });

      expect(activitiesResponse.status).toBe(200);
      expect(activitiesResponse.body).toHaveProperty('data');
      expect(activitiesResponse.body).toHaveProperty('meta');

      // 3. Generar itinerario con actividades filtradas
      const futureStartDate = new Date();
      futureStartDate.setDate(futureStartDate.getDate() + 7);
      const futureEndDate = new Date(futureStartDate);
      futureEndDate.setDate(futureEndDate.getDate() + 2);

      mockPrismaService.city.findUnique.mockResolvedValue({
        id: cityId,
        name: 'Test City',
        country: 'Test Country',
        timezone: 'UTC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockPrismaService.itinerary.create.mockResolvedValue({
        id: 'itinerary-id',
        title: 'Test Itinerary',
        userId,
        cityId,
        startDate: futureStartDate,
        endDate: futureEndDate,
        interests: ['gastronomía'],
        budgetApprox: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockPrismaService.itineraryDay.create.mockResolvedValue({
        id: 'day-id',
        dayNumber: 1,
        date: futureStartDate,
        itineraryId: 'itinerary-id',
      } as any);

      mockPrismaService.itineraryActivity.create.mockResolvedValue({
        id: 'itinerary-activity-id',
        dayId: 'day-id',
        activityId: 'activity-1',
        startTime: '09:00',
        endTime: '11:00',
        notes: null,
      } as any);

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: 'itinerary-id',
        title: 'Test Itinerary',
        userId,
        cityId,
        startDate: futureStartDate,
        endDate: futureEndDate,
        interests: ['gastronomía'],
        budgetApprox: null,
        description: null,
        city: {
          id: cityId,
          name: 'Test City',
          country: 'Test Country',
          timezone: 'UTC',
        },
        days: [
          {
            id: 'day-id',
            dayNumber: 1,
            date: futureStartDate,
            activities: [
              {
                id: 'itinerary-activity-id',
                startTime: '09:00',
                endTime: '11:00',
                activity: mockActivities[0],
              },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const itineraryResponse = await request(app.getHttpServer())
        .post('/api/itineraries/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cityId,
          startDate: futureStartDate.toISOString(),
          endDate: futureEndDate.toISOString(),
          interests: ['gastronomía'],
        });

      expect([200, 201]).toContain(itineraryResponse.status);
      if (itineraryResponse.status === 200 || itineraryResponse.status === 201) {
        expect(itineraryResponse.body).toHaveProperty('id');
        expect(mockPrismaService.itineraryActivity.create).toHaveBeenCalled();
      }
    });

    it('should handle scenario: no activities available', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.count.mockResolvedValue(0);
      mockPrismaService.city.findUnique.mockResolvedValue({
        id: cityId,
        name: 'Test City',
        country: 'Test Country',
        timezone: 'UTC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const futureStartDate = new Date();
      futureStartDate.setDate(futureStartDate.getDate() + 7);
      const futureEndDate = new Date(futureStartDate);
      futureEndDate.setDate(futureEndDate.getDate() + 2);

      const response = await request(app.getHttpServer())
        .post('/api/itineraries/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cityId,
          startDate: futureStartDate.toISOString(),
          endDate: futureEndDate.toISOString(),
          interests: ['gastronomía'],
        });

      expect(response.status).toBe(404);
    });
  });
});

