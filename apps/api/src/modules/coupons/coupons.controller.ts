import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/auth/roles.decorator';
import { CouponDto, ValidateCouponDto } from './dto';
import { CouponsService } from './coupons.service';

@Controller()
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Post('coupons/validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto.code, dto.courseId);
  }

  @Roles('ADMIN')
  @Get('admin/coupons')
  list() {
    return this.coupons.list();
  }

  @Roles('ADMIN')
  @Post('admin/coupons')
  create(@Body() dto: CouponDto) {
    return this.coupons.create(dto);
  }

  @Roles('ADMIN')
  @Patch('admin/coupons/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CouponDto>) {
    return this.coupons.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete('admin/coupons/:id')
  delete(@Param('id') id: string) {
    return this.coupons.delete(id);
  }
}
