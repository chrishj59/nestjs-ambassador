import { ClassSerializerInterceptor, Controller, Get, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';

import { AuthGuard } from '../auth/guards/auth.guard';
import { client } from '../main';
import { UserService } from './user.service';

@UseGuards(AuthGuard)
@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('admin/ambassadors')
  ambassadors() {
    return this.userService.find({ is_ambassador: true });
  }

  @Get('ambassador/rankings')
  async rankings(@Res() res: Response) {
    console.log('rankings');
    const result: string[] = await client.sendCommand([
      'ZREVRANGEBYSCORE',
      'rankings',
      '+inf',
      '-inf',
      'WITHSCORES',
    ]);
    let name;

    res.send(
      result.reduce((o, r) => {
        if (isNaN(parseInt(r))) {
          name = r;
          return o;
        } else {
          return {
            ...o,
            [name]: parseInt(r),
          };
        }
      }, {}),
    );
  }
}
