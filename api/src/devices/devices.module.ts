import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [PrismaModule],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
