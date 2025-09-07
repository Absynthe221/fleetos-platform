import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async yardSummary(depotId: string) {
    const depot = await this.prisma.depot.findUnique({ where: { id: depotId } });
    if (!depot) return null;
    const spots = await this.prisma.parkingSpot.findMany({ where: { depotId }, include: { truck: { select: { id: true, plate: true, vin: true, status: true, currentDriver: { select: { id: true, name: true } } } } } });
    const occupied = spots.filter(s => s.truck).length;
    const summary = {
      depot: { id: depot.id, name: depot.name },
      totals: { spots: spots.length, occupied, available: spots.length - occupied },
      spots: spots.map(s => ({
        id: s.id,
        spotNumber: s.spotNumber,
        spotType: (s as any).spotType,
        lengthCm: (s as any).lengthCm,
        widthCm: (s as any).widthCm,
        heightCm: (s as any).heightCm,
        maxWeightKg: (s as any).maxWeightKg,
        isCovered: (s as any).isCovered,
        hasCharger: (s as any).hasCharger,
        occupiedBy: s.truck ? { id: s.truck.id, plate: s.truck.plate, vin: s.truck.vin, status: (s.truck as any).status, driver: (s.truck as any).currentDriver } : null,
      })),
    };
    return summary;
  }

  async kpis() {
    const [trucks, depots] = await Promise.all([
      this.prisma.truck.findMany(),
      this.prisma.depot.findMany({ select: { id: true, name: true } }),
    ]);
    const total = trucks.length;
    const active = trucks.filter(t => t.status === 'ACTIVE').length;
    const inService = trucks.filter(t => t.status === 'IN_SERVICE').length;
    const yard = [] as any[];
    for (const d of depots) {
      const spots = await this.prisma.parkingSpot.findMany({ where: { depotId: d.id }, include: { truck: { select: { id: true } } } });
      const occ = spots.filter(s => s.truck).length;
      yard.push({ depotId: d.id, name: d.name, spots: spots.length, occupied: occ, available: spots.length - occ });
    }
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const [pass, fail, outbound, inbound] = await Promise.all([
      this.prisma.driverInspection.count({ where: { createdAt: { gte: start, lte: end }, status: 'PASS' } }),
      this.prisma.driverInspection.count({ where: { createdAt: { gte: start, lte: end }, status: 'FAIL' } }),
      this.prisma.gateEvent.count({ where: { timestamp: { gte: start, lte: end }, action: 'OUTBOUND_CHECK' } }),
      this.prisma.gateEvent.count({ where: { timestamp: { gte: start, lte: end }, action: 'INBOUND_CHECK' } }),
    ]);
    return {
      fleet: { total, active, inService, dueSoon: 0 },
      yard,
      security: { outboundToday: outbound, inboundToday: inbound },
      inspections: { todayPass: pass, todayFail: fail },
    };
  }

  async recent() {
    const [inspections, security] = await Promise.all([
      this.prisma.driverInspection.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.gateEvent.findMany({ orderBy: { timestamp: 'desc' }, take: 10 }),
    ]);
    return { inspections, security };
  }
}


