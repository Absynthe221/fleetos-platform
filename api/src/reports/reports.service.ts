import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async trucksCsvRows() {
    const trucks = await this.prisma.truck.findMany({ orderBy: { createdAt: 'desc' } });
    return trucks.map(t => ({
      id: t.id,
      vin: t.vin,
      plate: t.plate,
      year: t.year,
      status: t.status,
      depotId: t.depotId,
      barcode: t.barcode,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async maintenanceCsvRows() {
    const logs = await this.prisma.maintenanceLog.findMany({ orderBy: { date: 'desc' } });
    return logs.map(l => ({
      id: l.id,
      truckId: l.truckId,
      date: l.date.toISOString(),
      type: l.type,
      cost: l.cost?.toString() ?? '',
      notes: l.notes ?? '',
      nextServiceDate: l.nextServiceDate?.toISOString() ?? '',
    }));
  }

  async maintenanceDetailed() {
    return this.prisma.maintenanceLog.findMany({
      orderBy: { date: 'desc' },
      include: { truck: true },
      take: 500,
    });
  }

  async routesDetailed() {
    return this.prisma.route.findMany({
      orderBy: { routeDate: 'desc' },
      include: { truck: true, driver: true },
      take: 500,
    });
  }
}


