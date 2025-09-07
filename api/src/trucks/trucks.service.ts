import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTruckDto } from './dto/create-truck.dto';

@Injectable()
export class TrucksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTruckDto) {
    const { depotId, currentParkingSpotId, ...rest } = dto;
    // Normalize inputs to avoid accidental duplicates by case/whitespace
    if (rest.plate) rest.plate = rest.plate.trim().toUpperCase();
    if ((rest as any).vin) (rest as any).vin = (rest as any).vin.trim().toUpperCase();
    // ensure unique barcode: use provided or auto-generate
    let barcode = rest.barcode;
    if (!barcode) {
      barcode = `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    // if collision, retry a few times
    for (let i = 0; i < 3; i++) {
      const exists = await this.prisma.truck.findUnique({ where: { barcode } }).catch(() => null);
      if (!exists) break;
      barcode = `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    const data: Prisma.TruckCreateInput = {
      ...rest,
      barcode,
      depot: { connect: { id: depotId } },
      ...(currentParkingSpotId
        ? { currentParkingSpot: { connect: { id: currentParkingSpotId } } }
        : {}),
    } as unknown as Prisma.TruckCreateInput;
    try {
      return await this.prisma.truck.create({ data });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const target: string[] | undefined = e?.meta?.target;
        if (target?.includes('plate')) throw new ConflictException('Plate already exists');
        if (target?.includes('vin')) throw new ConflictException('VIN already exists');
        if (target?.includes('barcode')) throw new ConflictException('Barcode already exists');
        throw new ConflictException('Unique constraint violation');
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.truck.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const truck = await this.prisma.truck.findUnique({ where: { id } });
    if (!truck) throw new NotFoundException('Truck not found');
    return truck;
  }

  async update(id: string, data: Prisma.TruckUpdateInput) {
    try {
      return await this.prisma.truck.update({ where: { id }, data });
    } catch (e) {
      throw new NotFoundException('Truck not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.truck.delete({ where: { id } });
      return { id };
    } catch (e) {
      throw new NotFoundException('Truck not found');
    }
  }

  async lookup(query: string) {
    const q = query.trim();
    if (!q) return [];
    return this.prisma.truck.findMany({
      where: {
        OR: [
          { plate: { contains: q } },
          { vin: { contains: q } },
          { barcode: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}


