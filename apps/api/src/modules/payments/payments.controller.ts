import { BadRequestException, Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post('payments/webhook')
  webhook(@Req() req: Request, @Headers('x-razorpay-signature') signature: string) {
    if (!signature) throw new BadRequestException('Razorpay signature header is required');
    const raw = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.payments.webhook(raw, signature);
  }

  @Roles('ADMIN')
  @Post('admin/payments/:id/refund')
  refund(@Param('id') id: string, @Body('revokeAccess') revokeAccess = true) {
    return this.payments.refund(id, Boolean(revokeAccess));
  }
}
