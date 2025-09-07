import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';

@Injectable()
export class YardService {
  constructor(private prisma: PrismaService, private security: SecurityService) {}

  async generateSpots(depotId: string, totalSpots: number, pattern: string, reservedSpots: string[] = []) {
    const depot = await this.prisma.depot.findUnique({ where: { id: depotId } });
    if (!depot) throw new BadRequestException('Depot not found');

    const data = Array.from({ length: totalSpots }, (_, idx) => {
      const n = idx + 1;
      const spotNumber = pattern.replace(/\{n\}/g, String(n));
      return {
        depotId,
        spotNumber,
        spotType: 'MEDIUM' as const,
        isCovered: false,
        hasCharger: false,
      };
    });

    // SQLite does not support skipDuplicates; ensure uniqueness via @@unique([depotId, spotNumber])
    return this.prisma.parkingSpot.createMany({ data });
  }

  async replicate(templateDepotId: string, name: string, code: string, address: string) {
    const template = await this.prisma.depot.findUnique({ where: { id: templateDepotId }, include: { parkingSpots: true } });
    if (!template) throw new BadRequestException('Template depot not found');

    const depot = await this.prisma.depot.create({ data: { name, code, address } });
    if (template.parkingSpots.length) {
      await this.prisma.parkingSpot.createMany({
        data: template.parkingSpots.map((s) => ({
          depotId: depot.id,
          spotNumber: s.spotNumber,
          spotType: s.spotType,
          lengthCm: s.lengthCm,
          widthCm: s.widthCm,
          heightCm: s.heightCm,
          maxWeightKg: s.maxWeightKg,
          isCovered: s.isCovered ?? false,
          hasCharger: s.hasCharger ?? false,
        })),
      });
    }
    return depot;
  }

  async assignFirstFree(depotId: string, truckId: string, recordedBy?: string) {
    const truck = await this.prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck) throw new BadRequestException('Truck not found');
    if (truck.isLocked) throw new BadRequestException('Cannot assign parking spot to a locked truck');

    const free = await this.prisma.parkingSpot.findFirst({ where: { depotId, truck: null }, orderBy: { spotNumber: 'asc' } });
    if (!free) throw new BadRequestException('No free spots available');

    await this.security.parkingAssign({ truckId, parkingSpotId: free.id, recordedBy });
    return { truckId, depotId, spotId: free.id, spotNumber: free.spotNumber };
  }
}


