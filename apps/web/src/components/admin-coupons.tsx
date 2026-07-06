'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses?: number | null;
  usedCount: number;
  validUntil: string;
  isActive: boolean;
};

export function AdminCoupons() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('10');
  const [maxUses, setMaxUses] = useState('');
  const { data = [] } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api<Coupon[]>('/admin/coupons') });
  const create = useMutation({
    mutationFn: () => api('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code,
        discountType,
        discountValue: Number(discountValue),
        maxUses: maxUses ? Number(maxUses) : undefined,
        validFrom: today,
        validUntil: nextMonth,
        isActive: true,
      }),
    }),
    onSuccess: async () => {
      setCode('');
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim()) create.mutate();
  }

  return (
    <div className="admin-page">
      <div className="section-head admin-section-head">
        <span className="eyebrow">Coupons</span>
        <h1 className="q-h1 page-title">Discount codes</h1>
        <p>Create active coupons for checkout.</p>
      </div>
      <form className="dash-card admin-inline-form coupon-form" onSubmit={submit}>
        <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Code, e.g. QNYNE10" />
        <select value={discountType} onChange={(event) => setDiscountType(event.target.value as 'PERCENT' | 'FLAT')}>
          <option value="PERCENT">Percent</option>
          <option value="FLAT">Flat INR paise</option>
        </select>
        <input value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder="Value" />
        <input value={maxUses} onChange={(event) => setMaxUses(event.target.value)} placeholder="Max uses" />
        <button className="btn btn-primary" type="submit"><Plus size={16} /> Create</button>
      </form>
      {create.error ? <div className="form-error">{create.error.message}</div> : null}
      <div className="dash-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Valid until</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.code}</td>
                  <td>{coupon.discountType}</td>
                  <td>{coupon.discountValue}</td>
                  <td>{coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''}</td>
                  <td>{new Date(coupon.validUntil).toLocaleDateString()}</td>
                  <td>{coupon.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
