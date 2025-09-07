import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DutyState, Prisma } from '@prisma/client';

@Injectable()
export class DriverHosService {
  constructor(private readonly prisma: PrismaService) {}

  async setState(params: { driverId: string; state: DutyState; truckId?: string | null; note?: string | null; reasonCode?: string | null; source?: string }) {
    const { driverId, state, truckId, note, reasonCode } = params;
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    // Close current open duty event if any
    const last = await this.prisma.dutyEvent.findFirst({ where: { driverId, endedAt: null }, orderBy: { startedAt: 'desc' } });
    const now = new Date();
    if (last) {
      await this.prisma.dutyEvent.update({ where: { id: last.id }, data: { endedAt: now } });
    }

    // Create new event
    const event = await this.prisma.dutyEvent.create({
      data: {
        driver: { connect: { id: driverId } },
        state,
        startedAt: now,
        source: params.source || 'manual',
        reasonCode: reasonCode || undefined,
        note: note || undefined,
        ...(truckId ? { truck: { connect: { id: truckId } } } : {}),
      },
    });

    // Upsert status
    await this.prisma.driverStatus.upsert({
      where: { driverId },
      update: { state, since: now, truckId: truckId || undefined },
      create: { driverId, state, since: now, truckId: truckId || undefined },
    });

    return event;
  }

  async getStatus(driverId: string) {
    const status = await this.prisma.driverStatus.findUnique({ where: { driverId } });
    if (!status) return { state: 'OFF_DUTY', since: null };
    return status;
  }

  // Very simple summary for now: totals for today based on events
  async getSummary(driverId: string, days: number = 1) {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const events = await this.prisma.dutyEvent.findMany({ where: { driverId, startedAt: { gte: from } }, orderBy: { startedAt: 'asc' } });
    const totals: Record<DutyState, number> = { OFF_DUTY: 0, SLEEPER_BERTH: 0, ON_DUTY: 0, DRIVING: 0 } as any;
    for (const ev of events) {
      const end = ev.endedAt || to;
      const mins = Math.max(0, Math.floor((end.getTime() - ev.startedAt.getTime()) / 60000));
      totals[ev.state] = (totals[ev.state] || 0) + mins;
    }
    return { from, to, totals };
  }

  async getRemaining(driverId: string) {
    const sum = await this.getSummary(driverId, 1);
    const driving = (sum?.totals?.DRIVING as number) || 0;
    const onDuty = ((sum?.totals?.DRIVING as number) || 0) + ((sum?.totals?.ON_DUTY as number) || 0);
    const remainingDrivingMins = Math.max(0, 13 * 60 - driving);
    const remainingDutyMins = Math.max(0, 14 * 60 - onDuty);
    return { remainingDrivingMins, remainingDutyMins };
  }

  async compliance() {
    const drivers = await this.prisma.driver.findMany({ select: { id: true, name: true } });
    const statuses = await this.prisma.driverStatus.findMany();
    const truckIds = statuses.map(s => s.truckId).filter((v): v is string => !!v);
    const trucks = truckIds.length
      ? await this.prisma.truck.findMany({ where: { id: { in: truckIds } }, include: { depot: true } })
      : [];
    const truckMap = new Map(trucks.map(t => [t.id, t] as const));

    const out: Array<{
      driverId: string;
      name: string;
      state: DutyState;
      remainingDrivingMins: number;
      remainingDutyMins: number;
      truckId: string | null;
      depotId: string | null;
      depotName: string | null;
    }> = [];

    for (const d of drivers) {
      const rem = await this.getRemaining(d.id);
      const st = statuses.find(s => s.driverId === d.id);
      const truckId = st?.truckId ?? null;
      const truck = truckId ? truckMap.get(truckId) : undefined;
      out.push({
        driverId: d.id,
        name: d.name,
        state: (st?.state as DutyState) || 'OFF_DUTY',
        remainingDrivingMins: rem.remainingDrivingMins,
        remainingDutyMins: rem.remainingDutyMins,
        truckId,
        depotId: truck?.depotId ?? null,
        depotName: truck?.depot?.name ?? null,
      });
    }
    return out;
  }
}


