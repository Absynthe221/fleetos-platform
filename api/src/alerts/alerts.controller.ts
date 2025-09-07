import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get()
  async list(@Query('depotId') depotId?: string) {
    return this.alerts.getAggregated(depotId);
  }
}


