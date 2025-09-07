import { Body, Controller, Post } from '@nestjs/common';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  constructor(private readonly svc: IngestService) {}

  @Post('telemetry')
  telemetry(@Body() body: { secret: string; payload: any }) {
    return this.svc.ingest(body.secret, body.payload);
  }
}
