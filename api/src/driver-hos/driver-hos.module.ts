import { Module } from '@nestjs/common';
import { DriverHosService } from './driver-hos.service';
import { DriverHosController } from './driver-hos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DriverHosController],
  providers: [DriverHosService],
})
export class DriverHosModule {}


