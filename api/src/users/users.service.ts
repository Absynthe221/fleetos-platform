import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import Twilio from 'twilio';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; email: string; password: string; role: Role; depotId?: string | null }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({ data: { name: data.name, email: data.email, passwordHash, role: data.role, depotId: data.depotId ?? null } });

    // Optional SMS notify for drivers if env is configured
    if (user.role === 'DRIVER') {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      // Attempt to find a phone number for the driver if a matching driver record exists
      const driver = await this.prisma.driver.findFirst({ where: { name: user.name }, select: { phone: true } });
      const to = driver?.phone;
      if (sid && token && from && to) {
        try {
          const twilio = Twilio(sid, token);
          const body = `Welcome to Fleet OS. Login: ${user.email} Password: ${data.password}`;
          await twilio.messages.create({ from, to, body });
        } catch (_) {
          // ignore sms failures for now
        }
      }
    }

    return user;
  }

  list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { depot: true } });
  }

  async assignDepot(id: string, depotId: string | null) {
    return this.prisma.user.update({ where: { id }, data: { depotId } });
  }

  async setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }
}


