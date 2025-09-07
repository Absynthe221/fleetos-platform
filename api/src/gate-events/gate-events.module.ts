import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GateEventsService } from './gate-events.service';
import { GateEventsController } from './gate-events.controller';

@Module({
  imports: [PrismaModule],
  providers: [GateEventsService],
  controllers: [GateEventsController],
})
export class GateEventsModule {}


