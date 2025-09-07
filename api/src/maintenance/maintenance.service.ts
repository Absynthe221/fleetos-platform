import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  logsByTruck(truckId: string) {
    return this.prisma.maintenanceLog.findMany({ where: { truckId }, orderBy: { date: 'desc' } });
  }

  createLog(data: { truckId: string; date: Date; type: string; cost?: number; notes?: string; nextServiceDate?: Date; workOrderId?: string }) {
    return this.prisma.maintenanceLog.create({ data });
  }

  schedulesByTruck(truckId: string) {
    return this.prisma.serviceSchedule.findMany({ where: { truckId } });
  }

  upsertSchedule(data: { truckId: string; frequencyMiles?: number; frequencyDays?: number; lastOdometer?: number; lastServiceDate?: Date; nextServiceDate?: Date }) {
    // truckId is not unique in DB by default (to avoid interactive migrations).
    // Emulate upsert by findFirst + create/update.
    const { truckId, ...rest } = data;
    return this.prisma.serviceSchedule
      .findFirst({ where: { truckId } })
      .then((existing) => {
        if (!existing) {
          return this.prisma.serviceSchedule.create({ data: { truckId, ...rest } });
        }
        return this.prisma.serviceSchedule.update({ where: { id: existing.id }, data: rest });
      });
  }

  alertsByTruck(truckId: string) {
    return this.prisma.alert.findMany({ where: { truckId }, orderBy: { createdAt: 'desc' } });
  }

  upcoming(days: number) {
    const until = new Date();
    until.setDate(until.getDate() + Math.max(0, days));
    return this.prisma.serviceSchedule.findMany({
      where: {
        nextServiceDate: { lte: until },
      },
      include: { truck: true },
      orderBy: { nextServiceDate: 'asc' },
    });
  }
}


