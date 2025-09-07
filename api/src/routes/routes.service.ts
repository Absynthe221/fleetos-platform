import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.route.findMany({ orderBy: { routeDate: 'desc' } });
  }

  create(data: { truckId: string; driverId?: string; startPoint: string; stops?: any; destination: string; mileage?: number; fuelUsage?: number; routeDate?: Date }) {
    return this.prisma.route.create({ data });
  }
}


