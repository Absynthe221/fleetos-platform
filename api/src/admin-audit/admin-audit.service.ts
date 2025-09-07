import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async truckTimeline(truckId: string) {
    const [inspections, gates, maint] = await Promise.all([
      this.prisma.driverInspection.findMany({ where: { truckId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.gateEvent.findMany({ where: { truckId }, orderBy: { timestamp: 'desc' }, take: 100 }),
      this.prisma.maintenanceLog.findMany({ where: { truckId }, orderBy: { date: 'desc' }, take: 100 }),
    ]);
    const items = [
      ...inspections.map(i => ({ type: 'INSPECTION', ts: i.createdAt, data: i })),
      ...gates.map(g => ({ type: 'SECURITY', ts: g.timestamp, data: g })),
      ...maint.map(m => ({ type: 'MAINTENANCE', ts: m.date, data: m })),
    ];
    items.sort((a, b) => (a.ts > b.ts ? -1 : a.ts < b.ts ? 1 : 0));
    return items;
  }
}


