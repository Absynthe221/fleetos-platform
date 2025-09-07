import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParkingSpotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByDepot(depotId: string) {
    return this.prisma.parkingSpot.findMany({ where: { depotId }, orderBy: { spotNumber: 'asc' } });
  }

  create(data: { depotId: string; spotNumber: string; spotType?: 'SMALL'|'MEDIUM'|'LARGE'|'XL'; lengthCm?: number; widthCm?: number; heightCm?: number; maxWeightKg?: number; isCovered?: boolean; hasCharger?: boolean; }) {
    return this.prisma.parkingSpot.create({ data });
  }

  async assignTruck(spotId: string, truckId: string) {
    // Assign logically by updating truck.currentParkingSpotId
    await this.prisma.truck.update({ where: { id: truckId }, data: { currentParkingSpot: { connect: { id: spotId } } } });
    return this.prisma.truck.findUnique({ where: { id: truckId } });
  }
}


