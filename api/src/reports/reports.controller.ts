import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { stringify } from 'csv-stringify/sync';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import PDFDocument from 'pdfkit';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('trucks.csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  async trucksCsv(@Res() res: Response) {
    const rows = await this.reports.trucksCsvRows();
    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="trucks.csv"');
    res.send(csv);
  }

  @Get('maintenance.csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  async maintenanceCsv(@Res() res: Response) {
    const rows = await this.reports.maintenanceCsvRows();
    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="maintenance.csv"');
    res.send(csv);
  }

  @Get('maintenance.pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  async maintenancePdf(@Res() res: Response) {
    const items = await this.reports.maintenanceDetailed();
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="maintenance.pdf"');
    doc.pipe(res);
    doc.fontSize(16).text('Maintenance Report', { underline: true });
    doc.moveDown();
    items.forEach((l) => {
      doc.fontSize(11).text(`${new Date(l.date).toLocaleDateString()}  •  ${l.type}  •  Truck: ${l.truck?.plate || l.truckId}`);
      if (l.notes) doc.fontSize(10).fillColor('#555').text(l.notes, { indent: 12 });
      doc.fillColor('black');
      doc.moveDown(0.5);
    });
    doc.end();
  }

  @Get('routes.pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'FLEET_MANAGER')
  async routesPdf(@Res() res: Response) {
    const routes = await this.reports.routesDetailed();
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="routes.pdf"');
    doc.pipe(res);
    doc.fontSize(16).text('Routes Report', { underline: true });
    doc.moveDown();
    routes.forEach((r) => {
      const title = `${new Date(r.routeDate).toLocaleDateString()}  •  Truck: ${r.truck?.plate || r.truckId}  •  Driver: ${r.driver?.name || '—'}`;
      doc.fontSize(11).text(title);
      const details = `From: ${r.startPoint}  →  ${r.destination}`;
      doc.fontSize(10).fillColor('#555').text(details, { indent: 12 });
      doc.fillColor('black');
      doc.moveDown(0.5);
    });
    doc.end();
  }
}


