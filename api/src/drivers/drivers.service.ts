import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.driver.findMany({ orderBy: { name: 'asc' } });
  }

  create(data: { name: string; phone?: string; licenseNumber?: string; licenseExpiry?: Date }) {
    return this.prisma.driver.create({ data });
  }
}


