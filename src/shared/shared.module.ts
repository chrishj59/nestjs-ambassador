import { CacheModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as redisStore from 'cache-manager-redis-store';

//import type { ClientOpts as RedisClientOpts } from 'redis'
@Module({
  imports: [
    JwtModule.register({
      secret: 'MySecret',
      signOptions: { expiresIn: '1d' },
    }),
    CacheModule.register({
      store: redisStore,
      // Store-specific configuration:
      host: 'redis',
      port: 6379,
    }),
  ],

  exports: [JwtModule, CacheModule],
})
export class SharedModule {}
