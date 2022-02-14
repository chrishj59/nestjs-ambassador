import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as request from 'supertest';

import { AuthGuard } from '../auth/guards/auth.guard';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos/register.dto';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  @Post(['admin/register', 'ambassador/register'])
  async register(@Req() request: Request, @Body() body: RegisterDto) {
    // to extract data field not required spread has all the other fields
    const { password_confirm, ...data } = body;
    if (body.password !== body.password_confirm) {
      throw new BadRequestException('Passwords do not match');
    }
    const hashed = await bcrypt.hash(body.password, 12);

    return this.userService.save({
      ...data,
      password: hashed,
      is_ambassador: request.path === '/api/ambassador/register',
    });
  }

  @Post(['admin/login', 'ambassador/login'])
  async login(
    @Req() request: Request,
    // if only few fields can set in params instead of dto
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid creditials');
    }

    const adminLogin = request.path === '/api/admin/login';
    if (user.is_ambassador && adminLogin) {
      throw new UnauthorizedException();
    }

    const jwt = await this.jwtService.signAsync({
      id: user.id,
      scope: adminLogin ? 'admin' : 'ambassador',
    });

    response.cookie('jwt', jwt, { httpOnly: true });
    return { message: 'success' };
  }

  @UseGuards(AuthGuard)
  @Get(['admin/user', 'ambassador/user'])
  async user(@Req() request: Request) {
    const cookie = request.cookies['jwt'];

    const { id } = await this.jwtService.verifyAsync(cookie);

    if (request.path === '/api/admin/user') {
      console.log('admin user');
      return await this.userService.findOne({ id });
    }
    console.log('ambassador user');
    const user = await this.userService.findOne({
      id,
      relations: ['orders', 'orders.order_items'],
    }); // get childeren of children

    const { orders, passward, ...data } = user;
    return { ...data, revenue: user.revenue };
  }

  @Post(['admin/logout', 'ambassador/logout'])
  async logout(@Res({ passthrough: true }) resp: Response) {
    resp.clearCookie('jwt');
    return { message: 'success' };
  }

  @UseGuards(AuthGuard)
  @Put(['admin/users/info', 'ambassador/users/info'])
  async updateInfo(
    @Req() request: Request,
    @Body('first_name') first_name: string,
    @Body('last_name') last_name: string,
    @Body('email') email: string,
  ) {
    const cookie = request.cookies['jwt'];
    const { id } = await this.jwtService.verify(cookie);
    await this.userService.update(id, { first_name, last_name, email });
    return await this.userService.findOne({ id });
  }

  @UseGuards(AuthGuard)
  @Put(['admin/users/password', 'ambassador/users/password'])
  async updatePassword(
    @Req() request: Request,
    @Body('password') password: string,
    @Body('password_confirm') password_confirm: string,
  ) {
    if (password !== password_confirm) {
      throw new BadRequestException('Passwords do not match');
    }

    const cookie = request.cookies['jwt'];
    const { id } = await this.jwtService.verify(cookie);
    await this.userService.update(id, {
      password: await bcrypt.hash(password, 12),
    });
    return await this.userService.findOne({ id });
  }
}
