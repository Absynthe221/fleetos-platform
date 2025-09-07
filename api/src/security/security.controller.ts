import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { TrucksService } from '../trucks/trucks.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly svc: SecurityService, private readonly trucks: TrucksService) {}

  @Post('outbound')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY')
  outbound(@Body() body: { truckId: string; recordedBy?: string; notes?: string }) {
    return this.svc.outbound(body);
  }

  @Post('inbound')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY')
  inbound(@Body() body: { truckId: string; recordedBy?: string; notes?: string }) {
    return this.svc.inbound(body);
  }

  @Patch('parking/:truckId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY')
  parking(@Param('truckId') truckId: string, @Body() body: { parkingSpotId: string; recordedBy?: string }) {
    return this.svc.parkingAssign({ truckId, parkingSpotId: body.parkingSpotId, recordedBy: body.recordedBy });
  }

  @Get('trucks')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY')
  search(@Query('q') q = '') {
    return this.trucks.lookup(q);
  }

  @Patch('lock/:truckId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY')
  lock(@Param('truckId') truckId: string, @Body() body: { locked: boolean }) {
    return this.svc.setLock(truckId, !!body.locked);
  }

  @Patch('driver/:truckId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY')
  setDriver(@Param('truckId') truckId: string, @Body() body: { driverId: string | null }) {
    return this.svc.setCurrentDriver(truckId, body.driverId ?? null);
  }
}


