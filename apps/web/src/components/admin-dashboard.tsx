'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, paise } from '@/lib/api';

type Stats = { totalRevenue: number; activeStudents: number; coursesSoldThisMonth: number };
type Order = { id: string; amount: number; status: string; user: { email: string }; course: { title: string }; createdAt: string };

export function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api<Stats>('/admin/dashboard/stats') });
  const { data: orders = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api<Order[]>('/admin/orders') });
  const cards = [
    ['Total revenue', paise(data?.totalRevenue ?? 0)],
    ['Active students', String(data?.activeStudents ?? 0)],
    ['Sold this month', String(data?.coursesSoldThisMonth ?? 0)],
  ];
  return (
    <div className="admin-page">
      <div className="admin-stat-grid">
        {cards.map(([label, value]) => (
          <div key={label} className="dash-card admin-stat">
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <div className="dash-card">
          <div className="dash-section-head">
            <h2 className="q-h3">Recent purchases</h2>
            <Link href="/admin/orders">View all</Link>
          </div>
          <AdminOrdersTable orders={orders.slice(0, 6)} />
        </div>
        <div className="dash-card settings-card">
          <h2 className="q-h3">Admin actions</h2>
          <Link href="/admin/courses" className="btn btn-primary">Add courses and videos</Link>
          <Link href="/admin/blogs" className="btn btn-ghost">Create blog post</Link>
          <Link href="/admin/users" className="btn btn-ghost">Review students</Link>
        </div>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { data = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api<Order[]>('/admin/orders') });
  return (
    <div className="admin-page">
      <div className="section-head admin-section-head">
        <span className="eyebrow">Orders</span>
        <h1 className="q-h1 page-title">Payments and purchases</h1>
        <p>Razorpay and local test purchases appear here after successful checkout.</p>
      </div>
      <div className="dash-card">
        <AdminOrdersTable orders={data} />
      </div>
    </div>
  );
}

function AdminOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr><th>Student</th><th>Course</th><th>Amount</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.user.email}</td>
              <td>{order.course.title}</td>
              <td>{paise(order.amount)}</td>
              <td><span className="mono-pill">{order.status}</span></td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
