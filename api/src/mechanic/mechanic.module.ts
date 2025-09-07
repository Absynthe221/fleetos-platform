import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MechanicService } from './mechanic.service';
import { MechanicController } from './mechanic.controller';

@Module({ imports: [PrismaModule], controllers: [MechanicController], providers: [MechanicService] })
export class MechanicModule {}


