import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Get()
  findAll() {
    return this.routes.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  create(@Body() body: { truckId: string; driverId?: string; startPoint: string; stops?: any; destination: string; mileage?: number; fuelUsage?: number; routeDate?: Date }) {
    return this.routes.create(body);
  }
}


