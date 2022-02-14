import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Order } from '../order/entity/order.entity';
import { Link } from './entity/link.entity';
import { LinkService } from './link.service';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class LinkController {
  constructor(
    private linkService: LinkService,
    private authService: AuthService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('admin/users/:id/links')
  async all(@Param('id') id: number) {
    return this.linkService.find({
      user: id,
      relations: ['orders'],
    });
  }

  @UseGuards(AuthGuard)
  @Post('ambassador/links')
  async create(@Body('products') products: number[], @Req() request: Request) {
    const user = await this.authService.user(request);
    return this.linkService.save({
      code: Math.random().toString().substr(6),
      user,
      products: products.map((id) => ({ id })),
    });
  }

  @UseGuards(AuthGuard)
  @Get('ambassador/stats')
  async stats(@Req() request: Request) {
    const user = await this.authService.user(request);
    const links: Link[] = await this.linkService.find({
      user,
      relations: ['orders'],
    });

    return links.map((link) => {
      const completedCorders: Order[] = link.orders.filter((o) => o.complete);
      return {
        code: link.code,
        count: completedCorders.length,
        revenue: completedCorders.reduce((s, o) => s + o.ambassador_revenue, 0),
      };
    });
  }

  @Get('checkout/links/:code')
  async link(@Param('code') code: string) {
    return this.linkService.findOne({
      code,
      relations: ['user', 'products'],
    });
  }
}
