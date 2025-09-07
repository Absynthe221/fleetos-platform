import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTruck(truckId: string) {
    return this.prisma.document.findMany({ where: { truckId }, orderBy: { expiryDate: 'asc' } });
  }

  findExpiring(days: number) {
    const now = new Date();
    const until = new Date(now.getTime() + days * 86400000);
    return this.prisma.document.findMany({ where: { expiryDate: { lte: until } }, orderBy: { expiryDate: 'asc' } });
  }

  create(data: { truckId?: string; driverId?: string; type: string; docNumber?: string; issuedDate?: Date; expiryDate?: Date }) {
    return this.prisma.document.create({ data });
  }
}


