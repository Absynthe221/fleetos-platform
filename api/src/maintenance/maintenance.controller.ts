import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maint: MaintenanceService) {}

  @Get('logs/:truckId')
  logs(@Param('truckId') truckId: string) {
    return this.maint.logsByTruck(truckId);
  }

  @Post('logs')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER', 'MECHANIC')
  createLog(@Body() body: { truckId: string; date: Date; type: string; cost?: number; notes?: string; nextServiceDate?: Date; workOrderId?: string }) {
    return this.maint.createLog(body);
  }

  @Get('schedules/:truckId')
  schedules(@Param('truckId') truckId: string) {
    return this.maint.schedulesByTruck(truckId);
  }

  @Post('schedules')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER', 'MECHANIC')
  upsertSchedule(@Body() body: { truckId: string; frequencyMiles?: number; frequencyDays?: number; lastOdometer?: number; lastServiceDate?: Date; nextServiceDate?: Date }) {
    return this.maint.upsertSchedule(body);
  }

  @Get('alerts/:truckId')
  alerts(@Param('truckId') truckId: string) {
    return this.maint.alertsByTruck(truckId);
  }

  @Get('upcoming')
  upcoming(@Query('days') days = '14') {
    return this.maint.upcoming(parseInt(days, 10) || 14);
  }
}


