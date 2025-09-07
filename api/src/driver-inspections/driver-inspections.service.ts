import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverInspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { driverId: string; truckId: string; inspectionType: 'PRE_TRIP' | 'POST_TRIP'; notes?: string; answers?: any }) {
    // Auto-evaluate: if any boolean false or enum "No"/"Unsafe" present, mark FAIL, else PASS
    let status: 'PASS'|'FAIL' = 'PASS';
    const answers = data.answers ?? null;
    if (answers) {
      const flatVals: any[] = [];
      try {
        const collect = (obj: any) => {
          if (Array.isArray(obj)) obj.forEach(collect);
          else if (obj && typeof obj === 'object') Object.values(obj).forEach(collect);
          else flatVals.push(obj);
        };
        collect(answers);
        if (flatVals.some(v => v === false || v === 'No' || v === 'Unsafe')) status = 'FAIL';
      } catch {}
    }
    const inspection = await this.prisma.driverInspection.create({ data: { driverId: data.driverId, truckId: data.truckId, inspectionType: data.inspectionType, status, notes: data.notes, answersJson: answers } });
    await this.prisma.truck.update({ where: { id: data.truckId }, data: { lastInspectionId: inspection.id } });
    // Oil-change mileage alerting (simple heuristic using inspection odometer)
    try {
      if (data.inspectionType === 'POST_TRIP' && answers && (typeof answers['odometer_end'] === 'number')) {
        const endKm = Number(answers['odometer_end']);
        const schedule = await this.prisma.serviceSchedule.findFirst({ where: { truckId: data.truckId } });
        if (schedule && typeof schedule.frequencyMiles === 'number' && typeof schedule.lastOdometer === 'number') {
          const drivenSinceService = Math.max(0, endKm - (schedule.lastOdometer || 0));
          const remaining = (schedule.frequencyMiles || 10000) - drivenSinceService;
          if (remaining <= 0) {
            await this.prisma.alert.create({ data: { truckId: data.truckId, type: 'OIL_CHANGE_DUE', message: 'Oil change overdue based on km', severity: 'WARNING' as any } });
          } else if (remaining <= 500) {
            await this.prisma.alert.create({ data: { truckId: data.truckId, type: 'OIL_CHANGE_SOON', message: `Oil change due in ${remaining} km`, severity: 'INFO' as any } });
          }
        }
      }
    } catch {}
    return inspection;
  }

  listByTruck(truckId: string, take = 20) {
    return this.prisma.driverInspection.findMany({ where: { truckId }, orderBy: { createdAt: 'desc' }, take });
  }

  get(id: string) {
    return this.prisma.driverInspection.findUnique({ where: { id } });
  }
}


