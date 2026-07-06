import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto';

const isProd = process.env.NODE_ENV === 'production';
const accessCookie = { httpOnly: true, sameSite: 'lax' as const, secure: isProd, maxAge: 15 * 60 * 1000 };
const refreshCookie = { httpOnly: true, sameSite: 'lax' as const, secure: isProd, maxAge: 30 * 24 * 60 * 60 * 1000 };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.login(dto, req.headers['user-agent']);
    res.cookie('qnyne_access', session.accessToken, accessCookie);
    res.cookie('qnyne_refresh', session.refreshToken, refreshCookie);
    return session;
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.refresh(req.cookies?.qnyne_refresh, req.headers['user-agent']);
    res.cookie('qnyne_access', session.accessToken, accessCookie);
    res.cookie('qnyne_refresh', session.refreshToken, refreshCookie);
    return session;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('qnyne_access');
    res.clearCookie('qnyne_refresh');
    return this.auth.logout(req.cookies?.qnyne_refresh);
  }

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return user;
  }

  @Public()
  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(token, dto.password);
  }
}
