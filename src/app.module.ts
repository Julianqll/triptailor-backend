import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CitiesModule } from './cities/cities.module';
import { ActivitiesModule } from './activities/activities.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    CitiesModule,
    ActivitiesModule,
    ItinerariesModule,
    HealthModule,
  ],
})
export class AppModule {}

