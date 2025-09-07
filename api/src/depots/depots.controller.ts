import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DepotsService } from './depots.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('depots')
export class DepotsController {
  constructor(private readonly depots: DepotsService) {}

  @Get()
  findAll() {
    return this.depots.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  create(@Body() body: { name: string; code: string; address: string }) {
    return this.depots.create(body);
  }
}


