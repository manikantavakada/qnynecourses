import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomToken } from '../../common/utils/crypto';
import { EmailJob } from '../email/email.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJob>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email is already registered');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash: await argon2.hash(dto.password),
      },
    });
    const token = randomToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.emailQueue.add('verify-email', { type: 'verify-email', to: user.email, name: user.name, token });
    return { user: this.publicUser(user) };
  }

  async login(dto: LoginDto, deviceInfo?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueSession(user, deviceInfo);
  }

  async refresh(rawRefreshToken: string, deviceInfo?: string) {
    const payload = await this.verifyRefresh(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }
    if (!(await argon2.verify(stored.tokenHash, rawRefreshToken))) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    return this.issueSession(user, deviceInfo);
  }

  async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return { success: true };
    try {
      const payload = await this.verifyRefresh(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({ where: { id: payload.jti }, data: { revoked: true } });
    } catch {
      return { success: true };
    }
    return { success: true };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Verification link is invalid or expired');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { success: true };
    const token = randomToken();
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await this.emailQueue.add('password-reset', { type: 'password-reset', to: user.email, name: user.name, token });
    return { success: true };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or expired');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await argon2.hash(password) },
      }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      this.prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);
    return { success: true };
  }

  publicUser(user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'emailVerified' | 'avatarUrl'>) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
    };
  }

  private async issueSession(user: User, deviceInfo?: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '15m' },
    );
    const refreshId = randomToken(12);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: refreshId, type: 'refresh' },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: '30d' },
    );
    await this.prisma.refreshToken.create({
      data: {
        id: refreshId,
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken),
        deviceInfo,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { user: this.publicUser(user), accessToken, refreshToken };
  }

  private async verifyRefresh(token: string) {
    return this.jwt.verifyAsync<{ sub: string; jti: string; type: string }>(token, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
