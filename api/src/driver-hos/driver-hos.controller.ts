import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DriverHosService } from './driver-hos.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { DutyState } from '@prisma/client';

@Controller('driver/hos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DriverHosController {
  constructor(private readonly svc: DriverHosService) {}

  @Post('state')
  @Roles('DRIVER')
  async setState(@Req() req: any, @Body() body: { state: DutyState; truckId?: string; note?: string; reasonCode?: string }) {
    const driverId = req.user?.id;
    return this.svc.setState({ driverId, state: body.state, truckId: body.truckId, note: body.note, reasonCode: body.reasonCode });
  }

  @Get('status')
  @Roles('DRIVER')
  async status(@Req() req: any) {
    const driverId = req.user?.id;
    return this.svc.getStatus(driverId);
  }

  @Get('summary')
  @Roles('DRIVER', 'MANAGER', 'ADMIN')
  async summary(@Req() req: any, @Query('driverId') driverId?: string, @Query('days') days?: string) {
    const id = driverId || req.user?.id;
    const d = days ? parseInt(days, 10) : 1;
    return this.svc.getSummary(id, isNaN(d) ? 1 : d);
  }

  @Get('remaining')
  @Roles('DRIVER', 'MANAGER', 'ADMIN')
  async remaining(@Req() req: any, @Query('driverId') driverId?: string) {
    const id = driverId || req.user?.id;
    return this.svc.getRemaining(id);
  }

  @Get('compliance')
  @Roles('MANAGER', 'ADMIN')
  async compliance() {
    return this.svc.compliance();
  }
}


