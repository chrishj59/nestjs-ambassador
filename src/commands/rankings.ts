import { NestFactory } from '@nestjs/core';
import { createClient } from 'redis';

import { AppModule } from '../app.module';
import { User } from '../user/user';
import { UserService } from '../user/user.service';

//import { RedisService } from '../shared/redis.service';
const client = createClient({
  url: 'redis://redis:6379',
});
(async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  //const redisService = app.get(RedisService);
  await client.connect();
  const userService = app.get(UserService);
  const ambassadors: User[] = await userService.find({
    is_ambassador: true,
    relations: ['orders', 'orders.order_items'],
  });

  for (let i = 0; i < ambassadors.length; i++) {
    await client.zAdd('rankings', {
      score: ambassadors[i].revenue,
      value: ambassadors[i].name,
    });
  }

  process.exit();
})();
