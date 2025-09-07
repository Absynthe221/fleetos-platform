import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get('truck/:truckId')
  byTruck(@Param('truckId') truckId: string) {
    return this.docs.findByTruck(truckId);
  }

  @Get('expiring')
  expiring(@Query('days') days = '30') {
    return this.docs.findExpiring(parseInt(days, 10) || 30);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  create(@Body() body: { truckId?: string; driverId?: string; type: string; docNumber?: string; issuedDate?: Date; expiryDate?: Date }) {
    return this.docs.create(body);
  }
}


