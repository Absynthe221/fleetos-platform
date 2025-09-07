import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverInspectionsService } from './driver-inspections.service';
import { DriverInspectionsController } from './driver-inspections.controller';

@Module({
  imports: [PrismaModule],
  providers: [DriverInspectionsService],
  controllers: [DriverInspectionsController],
})
export class DriverInspectionsModule {}


