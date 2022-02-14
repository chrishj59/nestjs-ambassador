import {
  Body,
  CACHE_MANAGER,
  CacheInterceptor,
  CacheKey,
  CacheTTL,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';
import { Request } from 'express';

import { AuthGuard } from '../auth/guards/auth.guard';
import { ProductCreateDto } from './dtos/product-create.dto';
import { Product } from './product.entity';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard)
  @Get('admin/products')
  all() {
    return this.productService.find();
  }

  @UseGuards(AuthGuard)
  @Get('admin/products/get/:id')
  async get(@Param('id') id: number) {
    return this.productService.findOne({ id });
  }

  @UseGuards(AuthGuard)
  @Post('admin/products')
  async create(@Body() body: ProductCreateDto) {
    const product = await this.productService.save(body);
    this.eventEmitter.emit('product_updated');
    return product;
  }

  @UseGuards(AuthGuard)
  @Put('admin/products/:id')
  async update(@Param('id') id: number, @Body() body: ProductCreateDto) {
    await this.productService.update(id, body);
    this.eventEmitter.emit('product_updated');

    return await this.productService.findOne({ id });
  }

  @UseGuards(AuthGuard)
  @Delete('admin/products/:id')
  async delete(@Param('id') id: number) {
    const resp = this.productService.delete(id);
    this.eventEmitter.emit('product_updated');
    await this.productService.delete(id);
  }

  @CacheKey('products_frontend')
  @CacheTTL(30 * 60)
  @UseInterceptors(CacheInterceptor)
  @Get('ambassador/products/frontend')
  async frontend() {
    return await this.productService.find();
  }

  @Get('ambassador/products/backend')
  async backend(@Req() request: Request) {
    let products = await this.cacheManager.get<Product[]>('products+backend');
    if (!products) {
      products = await this.productService.find();
      await this.cacheManager.set('products_backend', products, { ttl: 1800 });
    }
    if (request.query.s) {
      const s = request.query.s.toString().toLowerCase();
      console.log(`s is ${s}`);
      products = products.filter(
        (p) =>
          p.title.toLowerCase().indexOf(s) >= 0 ||
          p.description.toLowerCase().indexOf(s) >= 0,
      );
    }
    if (request.query.sort === 'asc' || 'desc') {
      products.sort((a, b) => {
        const diff = a.price - b.price;
        if (diff === 0) return 0;
        const sign = Math.abs(diff) / diff; // -1 is dff is -useDebugValue(
        return request.query.sort === 'asc' ? sign : -sign;
      });
      //return // -1, 0, 1 -1 = b <async (params:type) => {
    }

    const page: number = parseInt(request.query.page as any) || 1;
    const perPage = 9;
    const total = products.length;

    const data = products.slice((page - 1) * perPage, page * perPage);

    return {
      data,
      total,
      page,
      last_page: Math.ceil(total / perPage),
    };
  }
}
