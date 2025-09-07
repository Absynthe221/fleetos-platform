import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('yard/depot/:depotId/summary')
  yard(@Param('depotId') depotId: string) {
    return this.svc.yardSummary(depotId);
  }

  @Get('dashboard/kpis')
  kpis() {
    return this.svc.kpis();
  }

  @Get('dashboard/recent')
  recent() {
    return this.svc.recent();
  }
}


