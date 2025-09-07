import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { ParkingSpotsModule } from '../parking-spots/parking-spots.module';
import { TrucksModule } from '../trucks/trucks.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, ParkingSpotsModule, TrucksModule, EventsModule],
  providers: [SecurityService],
  controllers: [SecurityController],
  exports: [SecurityService],
})
export class SecurityModule {}


