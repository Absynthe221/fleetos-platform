import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DriverInspectionsService } from './driver-inspections.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('driver-inspections')
export class DriverInspectionsController {
  constructor(private readonly svc: DriverInspectionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DRIVER')
  create(@Body() body: { driverId: string; truckId: string; inspectionType: 'PRE_TRIP' | 'POST_TRIP'; notes?: string; answers?: any }) {
    return this.svc.create(body);
  }

  @Get('truck/:truckId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DRIVER', 'ADMIN', 'FLEET_MANAGER')
  list(@Param('truckId') truckId: string, @Query('take') take = '20') {
    return this.svc.listByTruck(truckId, parseInt(take, 10) || 20);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DRIVER', 'ADMIN', 'FLEET_MANAGER')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}


