import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('admin/audit')
export class AdminAuditController {
  constructor(private readonly svc: AdminAuditService) {}

  @Get('trucks/:truckId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  truck(@Param('truckId') truckId: string) {
    return this.svc.truckTimeline(truckId);
  }
}


