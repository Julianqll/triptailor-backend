import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { redisStore } from 'cache-manager-redis-yet';
import { createClient } from 'redis';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');

        const redisClient = createClient({
          socket: {
            host,
            port,
          },
          password: password || undefined,
        });

        // Conectar a Redis
        if (!redisClient.isOpen) {
          await redisClient.connect();
        }

        return {
          store: await redisStore({
            socket: {
              host,
              port,
            },
            password: password || undefined,
          }),
          ttl: 300 * 1000, // Default TTL: 5 minutes in milliseconds
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}

