import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.depot.findMany({ orderBy: { name: 'asc' } });
  }

  create(data: { name: string; code: string; address: string }) {
    return this.prisma.depot.create({ data });
  }
}


