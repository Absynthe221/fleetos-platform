import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuditService } from './admin-audit.service';
import { AdminAuditController } from './admin-audit.controller';

@Module({
  imports: [PrismaModule],
  providers: [AdminAuditService],
  controllers: [AdminAuditController],
})
export class AdminAuditModule {}


