import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TrucksModule } from './trucks/trucks.module';
import { DepotsModule } from './depots/depots.module';
import { ParkingSpotsModule } from './parking-spots/parking-spots.module';
import { RoutesModule } from './routes/routes.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { DriversModule } from './drivers/drivers.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { GateEventsModule } from './gate-events/gate-events.module';
import { ReportsModule } from './reports/reports.module';
import { DriverInspectionsModule } from './driver-inspections/driver-inspections.module';
import { SecurityModule } from './security/security.module';
import { AdminAuditModule } from './admin-audit/admin-audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DevicesModule } from './devices/devices.module';
import { IngestModule } from './ingest/ingest.module';
import { YardModule } from './yard/yard.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { UsersModule } from './users/users.module';
import { DriverHosModule } from './driver-hos/driver-hos.module';
import { AlertsModule } from './alerts/alerts.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [PrismaModule, TrucksModule, DepotsModule, ParkingSpotsModule, RoutesModule, MaintenanceModule, DriversModule, AuthModule, DocumentsModule, GateEventsModule, ReportsModule, DriverInspectionsModule, SecurityModule, AdminAuditModule, DashboardModule, DevicesModule, IngestModule, YardModule, MechanicModule, UsersModule, DriverHosModule, AlertsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
