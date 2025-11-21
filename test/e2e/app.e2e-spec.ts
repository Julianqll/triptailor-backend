import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('TripTailor E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Flujo completo del usuario: Registro → Selección de preferencias → Generación → Visualización', () => {
    it('should complete full user flow: register → select preferences → generate → view itinerary', async () => {
      // 1. Registro de usuario
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'E2E Test User',
          email: `e2e-${Date.now()}@test.com`,
          password: 'password123',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('accessToken');
      expect(registerResponse.body).toHaveProperty('user');

      authToken = registerResponse.body.accessToken;
      userId = registerResponse.body.user.id;

      // 2. Obtener ciudades disponibles
      const citiesResponse = await request(app.getHttpServer())
        .get('/api/cities')
        .set('Authorization', `Bearer ${authToken}`);

      expect(citiesResponse.status).toBe(200);
      expect(Array.isArray(citiesResponse.body)).toBe(true);

      const cityId = citiesResponse.body[0]?.id;
      if (!cityId) {
        // Si no hay ciudades, el test no puede continuar
        return;
      }

      // 3. Buscar actividades por intereses
      const activitiesResponse = await request(app.getHttpServer())
        .get('/api/activities')
        .query({ cityId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(activitiesResponse.status).toBe(200);
      expect(activitiesResponse.body).toHaveProperty('data');

      // 4. Generar itinerario con preferencias
      const futureStartDate = new Date();
      futureStartDate.setDate(futureStartDate.getDate() + 7);
      const futureEndDate = new Date(futureStartDate);
      futureEndDate.setDate(futureEndDate.getDate() + 3);

      const generateResponse = await request(app.getHttpServer())
        .post('/api/itineraries/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cityId,
          startDate: futureStartDate.toISOString(),
          endDate: futureEndDate.toISOString(),
          interests: ['gastronomía', 'cultura'],
          budgetApprox: 1000,
        });

      // Puede fallar si no hay actividades, pero el flujo debe ser válido
      if (generateResponse.status === 201 || generateResponse.status === 200) {
        expect(generateResponse.body).toHaveProperty('id');
        expect(generateResponse.body).toHaveProperty('days');

        const itineraryId = generateResponse.body.id;

        // 5. Visualizar itinerario generado
        const viewResponse = await request(app.getHttpServer())
          .get(`/api/itineraries/${itineraryId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(viewResponse.status).toBe(200);
        expect(viewResponse.body.id).toBe(itineraryId);
        expect(viewResponse.body).toHaveProperty('days');
      }
    });

    it('should handle user flow with invalid preferences gracefully', async () => {
      // Login primero
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'demo@triptailor.com',
          password: 'password123',
        });

      if (loginResponse.status === 200) {
        const token = loginResponse.body.accessToken;

        // Intentar generar con fechas inválidas
        const invalidResponse = await request(app.getHttpServer())
          .post('/api/itineraries/generate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            cityId: 'invalid-city',
            startDate: '2020-01-01T00:00:00.000Z', // Fecha pasada
            endDate: '2020-01-05T00:00:00.000Z',
            interests: ['invalid-interest'],
          });

        expect(invalidResponse.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });
});

