import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  // Development-only endpoint to mint a token without credentials
  @Post('dev-token')
  devToken(@Body() body: { role?: Role }) {
    return this.auth.devToken(body?.role ?? 'MECHANIC');
  }

  @Post('password/request')
  requestReset(@Body() body: { email: string }) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Post('password/reset')
  reset(@Body() body: { token: string; password: string }) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user?.sub);
  }
}


