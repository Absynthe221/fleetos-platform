import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GateEventsService } from './gate-events.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('gate-events')
export class GateEventsController {
  constructor(private readonly gates: GateEventsService) {}

  @Get('truck/:truckId')
  list(@Param('truckId') truckId: string) {
    return this.gates.listForTruck(truckId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER', 'MECHANIC')
  record(@Body() body: { truckId: string; eventType: 'ENTRY' | 'EXIT'; recordedBy?: string; notes?: string }) {
    return this.gates.record(body);
  }
}


