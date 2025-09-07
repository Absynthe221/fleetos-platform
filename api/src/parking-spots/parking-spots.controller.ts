import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ParkingSpotsService } from './parking-spots.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('parking-spots')
export class ParkingSpotsController {
  constructor(private readonly spots: ParkingSpotsService) {}

  @Get('depot/:depotId')
  byDepot(@Param('depotId') depotId: string) {
    return this.spots.findAllByDepot(depotId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  create(@Body() body: { depotId: string; spotNumber: string; spotType?: 'SMALL'|'MEDIUM'|'LARGE'|'XL'; lengthCm?: number; widthCm?: number; heightCm?: number; maxWeightKg?: number; isCovered?: boolean; hasCharger?: boolean; }) {
    return this.spots.create(body);
  }

  @Post('assign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  assign(@Body() body: { spotId: string; truckId: string }) {
    return this.spots.assignTruck(body.spotId, body.truckId);
  }
}


