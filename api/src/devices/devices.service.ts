import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(name: string | undefined, truckId: string | undefined) {
    const secret = randomBytes(24).toString('hex');
    const device = await this.prisma.device.create({ data: { name, truckId: truckId || null, secret } });
    return { id: device.id, secret: device.secret };
  }

  async verify(secret: string) {
    const device = await this.prisma.device.findUnique({ where: { secret } });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }
}
