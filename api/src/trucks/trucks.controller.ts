import { Body, Controller, Delete, Get, Param, Patch, Post, Res, Query, UseGuards } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import type { Response } from 'express';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  create(@Body() dto: CreateTruckDto) {
    return this.trucksService.create(dto as any);
  }

  @Get()
  findAll() {
    return this.trucksService.findAll();
    
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trucksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateTruckDto) {
    return this.trucksService.update(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  remove(@Param('id') id: string) {
    return this.trucksService.remove(id);
  }

  @Get('lookup')
  lookup(@Query('q') q: string) {
    return this.trucksService.lookup(q ?? '');
  }

  @Get(':id/qr')
  async qr(@Param('id') id: string, @Res() res: Response) {
    const url = `${process.env.PUBLIC_TRUCK_URL ?? 'http://localhost:3000'}/trucks/${id}`;
    const png = await QRCode.toBuffer(url, { width: 256, margin: 1 });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  }

  @Get(':id/barcode')
  async barcode(@Param('id') id: string, @Res() res: Response) {
    const truck = await this.trucksService.findOne(id);
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: truck.barcode || truck.plate,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  }
}


