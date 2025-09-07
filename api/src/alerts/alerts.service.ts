import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getAggregated(depotId?: string) {
    const whereTruck = depotId ? { depotId } : {};

    const expiringDocs = await this.prisma.document.findMany({
      where: {
        truck: whereTruck as any,
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      },
      include: { truck: { select: { id: true, plate: true, name: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 50,
    });

    const failingInspections = await this.prisma.driverInspection.findMany({
      where: { status: 'FAIL', truck: whereTruck as any },
      include: { truck: { select: { id: true, plate: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const upcomingMaintenance = await this.prisma.serviceSchedule.findMany({
      where: { truck: whereTruck as any, nextServiceDate: { not: null } },
      include: { truck: { select: { id: true, plate: true, name: true } } },
      orderBy: { nextServiceDate: 'asc' },
      take: 50,
    });

    const recentSecurity = await this.prisma.gateEvent.findMany({
      where: depotId ? { depotId } as any : {},
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return {
      expiringDocs,
      failingInspections,
      upcomingMaintenance,
      recentSecurity,
    };
  }
}


