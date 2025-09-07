import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { YardService } from './yard.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('yard')
export class YardController {
  constructor(private readonly yard: YardService) {}

  @Post('depot/:depotId/generate-spots')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  generate(@Param('depotId') depotId: string, @Body() body: { totalSpots: number; pattern: string; reservedSpots?: string[] }) {
    return this.yard.generateSpots(depotId, body.totalSpots, body.pattern || 'A{n}', body.reservedSpots || []);
  }

  @Post('replicate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  replicate(@Body() body: { templateDepotId: string; name: string; code: string; address: string }) {
    return this.yard.replicate(body.templateDepotId, body.name, body.code, body.address);
  }

  @Post('depot/:depotId/assign-first-free')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SECURITY', 'FLEET_MANAGER')
  assign(@Param('depotId') depotId: string, @Body() body: { truckId: string; recordedBy?: string }) {
    return this.yard.assignFirstFree(depotId, body.truckId, body.recordedBy);
  }
}


