import { Module } from '@nestjs/common';
import { ParkingSpotsService } from './parking-spots.service';
import { ParkingSpotsController } from './parking-spots.controller';

@Module({
  controllers: [ParkingSpotsController],
  providers: [ParkingSpotsService],
})
export class ParkingSpotsModule {}


