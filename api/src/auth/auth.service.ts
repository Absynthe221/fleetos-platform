import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const access_token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email });
    return { access_token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  // Development helper: mint a JWT without checking DB credentials
  async devToken(role: Role = 'MECHANIC' as Role) {
    const user = { id: 'dev-user', name: 'Dev User', email: `dev+${role.toLowerCase()}@example.com`, role } as const;
    const access_token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email });
    return { access_token, user };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    const token = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).toUpperCase();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await this.prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
    // In production: send email. For now, return token for manual flow.
    return { ok: true, token };
  }

  async resetPassword(token: string, password: string) {
    const pr = await this.prisma.passwordReset.findUnique({ where: { token } });
    if (!pr) throw new NotFoundException('Invalid token');
    if (pr.usedAt) throw new BadRequestException('Token already used');
    if (pr.expiresAt < new Date()) throw new BadRequestException('Token expired');
    const hash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: pr.userId }, data: { passwordHash: hash } });
      await tx.passwordReset.update({ where: { token }, data: { usedAt: new Date() } });
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}


