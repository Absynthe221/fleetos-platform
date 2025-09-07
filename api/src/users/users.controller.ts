import { Body, Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() body: { name: string; email: string; password: string; role: Role; depotId?: string | null }) {
    return this.users.create(body);
  }

  @Roles('ADMIN')
  @Get()
  list() {
    return this.users.list();
  }

  @Roles('ADMIN')
  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { depotId?: string | null }) {
    return this.users.assignDepot(id, body?.depotId ?? null);
  }

  @Roles('ADMIN')
  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.users.setActive(id, !!body?.isActive);
  }
}


