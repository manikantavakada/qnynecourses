import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/auth/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';

@Roles('ADMIN')
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('dashboard/stats')
  stats() {
    return this.dashboard.stats();
  }

  @Get('dashboard/revenue')
  revenue() {
    return this.dashboard.revenue();
  }

  @Get('orders')
  orders() {
    return this.dashboard.orders();
  }
}
