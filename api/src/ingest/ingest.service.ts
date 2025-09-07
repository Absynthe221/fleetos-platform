import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class IngestService {
  constructor(private readonly prisma: PrismaService, private readonly devices: DevicesService) {}

  async ingest(secret: string, payload: any) {
    const device = await this.devices.verify(secret);
    const truckId = device.truckId || null;
    const raw = await this.prisma.telemetryRaw.create({ data: { deviceId: device.id, truckId, payload } });

    // Basic normalization examples
    const signals: any[] = [];
    if (payload?.odometer != null && truckId) signals.push({ type: 'ODOMETER', value: payload.odometer });
    if (payload?.rpm != null && truckId) signals.push({ type: 'RPM', value: payload.rpm });
    if (payload?.fuel_level != null && truckId) signals.push({ type: 'FUEL_LEVEL', value: payload.fuel_level });
    if (payload?.gps && truckId) signals.push({ type: 'GPS', value: payload.gps });

    for (const s of signals) {
      await this.prisma.vehicleSignal.create({ data: { deviceId: device.id, truckId: truckId!, type: s.type as any, value: s.value } });
    }

    // Optional trip events
    if (payload?.event?.type && truckId) {
      await this.prisma.tripEvent.create({ data: { deviceId: device.id, truckId: truckId!, type: payload.event.type as any, details: payload.event } });
    }

    // Update truck simple fields
    if (truckId && payload?.odometer != null) {
      await this.prisma.truck.update({ where: { id: truckId }, data: { /* extend later */ } });
    }

    await this.prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
    return { ok: true, id: raw.id };
  }
}
