export function coursePayableAmount(course: { price: number; discountPrice: number | null }) {
  return course.discountPrice ?? course.price;
}

export function applyCoupon(
  amount: number,
  coupon?: { discountType: string; discountValue: number } | null,
) {
  if (!coupon) return { finalAmount: amount, discountAmount: 0 };
  const discount =
    coupon.discountType === 'PERCENT'
      ? Math.floor((amount * coupon.discountValue) / 100)
      : coupon.discountValue;
  const discountAmount = Math.min(Math.max(discount, 0), amount);
  return { finalAmount: amount - discountAmount, discountAmount };
}
