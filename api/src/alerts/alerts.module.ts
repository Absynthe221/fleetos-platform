import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';

@Module({
  imports: [PrismaModule],
  providers: [AlertsService],
  controllers: [AlertsController],
})
export class AlertsModule {}


