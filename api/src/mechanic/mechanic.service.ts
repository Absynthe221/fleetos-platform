import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TruckStatus } from '@prisma/client';

@Injectable()
export class MechanicService {
  constructor(private prisma: PrismaService) {}

  async logInspection(data: { truckId: string; mechanicId: string; type: 'PRE_TRIP'|'POST_TRIP'; status: 'PASS'|'FAIL'; notes?: string }) {
    const truck = await this.prisma.truck.findUnique({ where: { id: data.truckId } });
    if (!truck) throw new BadRequestException('Truck not found');

    const inspection = await this.prisma.driverInspection.create({
      data: { driverId: data.mechanicId, truckId: data.truckId, inspectionType: data.type, status: data.status, notes: data.notes, answersJson: Prisma.JsonNull },
    });

    if (data.status === 'FAIL') {
      await this.prisma.truck.update({ where: { id: truck.id }, data: { status: TruckStatus.OUT_OF_SERVICE } });
      await this.prisma.alert.create({ data: { truckId: truck.id, type: 'inspection_fail', message: `Failed ${data.type.toLowerCase()} inspection`, severity: 'WARNING' } });
    }
    return inspection;
  }

  createComplaint(data: { truckId: string; driverId: string; type: string; description: string }) {
    return this.prisma.complaint.create({ data });
  }
  listComplaints(resolved?: boolean) {
    return this.prisma.complaint.findMany({ where: resolved === undefined ? {} : { resolved }, orderBy: { createdAt: 'desc' } });
  }
  resolveComplaint(id: string) {
    return this.prisma.complaint.update({ where: { id }, data: { resolved: true } });
  }

  async failingTrucks() {
    const recentFails = await this.prisma.driverInspection.findMany({ where: { status: 'FAIL' }, orderBy: { createdAt: 'desc' }, take: 100, include: { truck: true } });
    return recentFails.map(i => ({ truck: i.truck, at: i.createdAt, type: i.inspectionType }));
  }

  async maintenanceHistory(truckId: string) {
    const [inspections, logs, complaints] = await this.prisma.$transaction([
      this.prisma.driverInspection.findMany({ where: { truckId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.maintenanceLog.findMany({ where: { truckId }, orderBy: { date: 'desc' }, take: 100 }),
      this.prisma.complaint.findMany({ where: { truckId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);
    return { inspections, logs, complaints };
  }
}


