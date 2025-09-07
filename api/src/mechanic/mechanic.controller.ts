import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { MechanicService } from './mechanic.service';

@Controller('mechanic')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('MECHANIC', 'FLEET_MANAGER', 'ADMIN')
export class MechanicController {
  constructor(private readonly svc: MechanicService) {}

  @Post('inspection')
  log(@Body() b: { truckId: string; mechanicId: string; type: 'PRE_TRIP'|'POST_TRIP'; status: 'PASS'|'FAIL'; notes?: string }) {
    return this.svc.logInspection(b);
  }

  @Post('complaints')
  @Roles('DRIVER','MECHANIC','FLEET_MANAGER','ADMIN')
  createComplaint(@Body() b: { truckId: string; driverId: string; type: string; description: string }) {
    return this.svc.createComplaint(b);
  }

  @Get('complaints')
  complaints(@Query('resolved') resolved?: 'true'|'false') {
    return this.svc.listComplaints(resolved === undefined ? undefined : resolved === 'true');
  }

  @Patch('complaints/:id/resolve')
  resolve(@Param('id') id: string) {
    return this.svc.resolveComplaint(id);
  }

  @Get('failing-trucks')
  failing() { return this.svc.failingTrucks(); }

  @Get('history/:truckId')
  history(@Param('truckId') truckId: string) { return this.svc.maintenanceHistory(truckId); }
}


