import { Body, Controller, Post } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly svc: DevicesService) {}

  @Post('register')
  register(@Body() body: { name?: string; truckId?: string }) {
    return this.svc.register(body.name, body.truckId);
  }
}
