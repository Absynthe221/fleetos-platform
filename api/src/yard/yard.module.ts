import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YardService } from './yard.service';
import { YardController } from './yard.controller';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [YardController],
  providers: [YardService],
})
export class YardModule {}


