import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GateEventsService {
  constructor(private readonly prisma: PrismaService) {}

  listForTruck(truckId: string, limit = 50) {
    return this.prisma.gateEvent.findMany({ where: { truckId }, orderBy: { timestamp: 'desc' }, take: limit });
  }

  record(data: { truckId: string; eventType: 'ENTRY' | 'EXIT'; recordedBy?: string; notes?: string }) {
    const action = data.eventType === 'ENTRY' ? 'INBOUND_CHECK' : 'OUTBOUND_CHECK';
    return this.prisma.gateEvent.create({ data: { action, truckId: data.truckId, recordedBy: data.recordedBy, notes: data.notes } });
  }
}


