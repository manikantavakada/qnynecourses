'use client';

import { CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';

type RazorpayCheckout = new (options: Record<string, unknown>) => { open: () => void };

type CreateOrderResponse = {
  razorpayOrderId: string;
  amount: number;
  keyId: string;
  localCheckout?: boolean;
  redirectTo?: string;
};

declare global {
  interface Window {
    Razorpay?: RazorpayCheckout;
  }
}

export function BuyButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api<{ id: string } | null>('/users/me').catch(() => null),
    retry: false,
  });

  const { data: enrolledCourses = [], isPending } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api<Array<{ id: string; course: { id: string } }>>('/me/courses').catch(() => []),
    enabled: !!user,
  });

  const isEnrolled = enrolledCourses.some((item) => item.course.id === courseId);

  async function buy() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (isEnrolled) {
      router.push(`/my-courses/${courseId}`);
      return;
    }
    setIsBuying(true);
    setMessage(null);
    try {
      const order = await api<CreateOrderResponse>('/orders/create', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });

      if (order.localCheckout) {
        setMessage('Enrollment complete. Opening your courses...');
        router.push(order.redirectTo ?? '/my-courses');
        router.refresh();
        return;
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        setMessage('Payment checkout is still loading. Please try again in a moment.');
        return;
      }

      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        order_id: order.razorpayOrderId,
        handler: async (response: Record<string, string>) => {
          await api('/orders/verify', { method: 'POST', body: JSON.stringify(response) });
          router.push('/my-courses');
          router.refresh();
        },
      });
      checkout.open();
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        router.push('/login');
        return;
      }
      if (error instanceof ApiError && error.message.toLowerCase().includes('already owned')) {
        router.push('/my-courses');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Could not start checkout. Please try again.');
    } finally {
      setIsBuying(false);
    }
  }

  const buttonText = !user ? 'Log in to buy' : isEnrolled ? 'Go to course' : 'Buy now';

  return (
    <div>
      <button className="btn btn-primary btn-block" type="button" onClick={buy} disabled={isBuying || (!!user && isPending)}>
        {isBuying || (!!user && isPending) ? <Loader2 className="spin" size={16} /> : <CreditCard size={16} />}
        {isBuying ? 'Processing...' : (!!user && isPending) ? 'Checking...' : buttonText}
      </button>
      {message ? <div className="inline-note">{message}</div> : null}
    </div>
  );
}
