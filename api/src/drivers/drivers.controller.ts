import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  findAll() {
    return this.drivers.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  create(@Body() body: { name: string; phone?: string; licenseNumber?: string; licenseExpiry?: Date }) {
    return this.drivers.create(body);
  }
}


