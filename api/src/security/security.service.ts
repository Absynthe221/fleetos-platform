import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventsService) {}

  outbound(data: { truckId: string; recordedBy?: string; notes?: string }) {
    // Free the current parking spot on outbound by clearing the truck's currentParkingSpot
    return this.prisma.$transaction(async (tx) => {
      const truck = await tx.truck.findUnique({ where: { id: data.truckId } });
      if (truck?.currentParkingSpotId) {
        await tx.truck.update({ where: { id: data.truckId }, data: { currentParkingSpot: { disconnect: true } } });
      }
      const evt = await tx.gateEvent.create({ data: { action: 'OUTBOUND_CHECK', truckId: data.truckId, recordedBy: data.recordedBy, notes: data.notes } });
      this.events.emit('gate', evt);
      return evt;
    });
  }

  async inbound(data: { truckId: string; recordedBy?: string; notes?: string }) {
    // Auto-assign first suitable free spot (size/weight) in same depot if available
    const truck = await this.prisma.truck.findUnique({ where: { id: data.truckId } });
    const candidate = truck?.depotId ? await this.prisma.parkingSpot.findFirst({
      where: {
        depotId: truck.depotId,
        truck: null,
        OR: [
          { spotType: 'XL' },
          {
            AND: [
              { maxWeightKg: { gte: (truck?.weightKg || 0) } },
              { lengthCm: { gte: (truck?.lengthCm || 0) } },
              { widthCm: { gte: (truck?.widthCm || 0) } },
              { heightCm: { gte: (truck?.heightCm || 0) } },
            ],
          },
        ],
      },
      orderBy: { spotNumber: 'asc' },
    }) : null;
    const evt = await this.prisma.gateEvent.create({ data: { action: 'INBOUND_CHECK', truckId: data.truckId, recordedBy: data.recordedBy, notes: data.notes, parkingSpotId: candidate?.id } });
    if (candidate) {
      await this.prisma.truck.update({ where: { id: data.truckId }, data: { currentParkingSpot: { connect: { id: candidate.id } } } });
    }
    this.events.emit('gate', evt);
    return evt;
  }

  parkingAssign(data: { truckId: string; parkingSpotId: string; recordedBy?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const truck = await tx.truck.findUnique({ where: { id: data.truckId } });
      if (!truck) throw new Error('Truck not found');
      if (truck.isLocked) throw new Error('Truck is locked; unlock before assigning a spot');
      await tx.truck.update({ where: { id: data.truckId }, data: { currentParkingSpot: { connect: { id: data.parkingSpotId } } } });
      const evt = await tx.gateEvent.create({ data: { action: 'PARKING_ASSIGNMENT', truckId: data.truckId, parkingSpotId: data.parkingSpotId, recordedBy: data.recordedBy } });
      this.events.emit('gate', evt);
      return { ok: true };
    });
  }

  setLock(truckId: string, locked: boolean) {
    return this.prisma.truck.update({ where: { id: truckId }, data: { isLocked: locked } });
  }

  setCurrentDriver(truckId: string, driverId: string | null) {
    return this.prisma.truck.update({ where: { id: truckId }, data: { currentDriverId: driverId } });
  }
}


