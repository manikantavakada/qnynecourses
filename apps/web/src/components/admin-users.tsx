'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Check, ShieldAlert, X, Plus } from 'lucide-react';
import { api, paise } from '@/lib/api';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  userCourses: Array<{ id: string }>;
};

type AdminUserDetail = Omit<AdminUser, 'userCourses'> & {
  orders: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    course: { title: string };
  }>;
  userCourses: Array<{
    id: string;
    status: string;
    purchasedAt: string;
    expiresAt: string | null;
    course: { id: string; title: string };
  }>;
};

type SimpleCourse = {
  id: string;
  title: string;
};

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Manual enrollment form state
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [enrollValidity, setEnrollValidity] = useState('0');
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  // Expiry dates form state (keyed by userCourse.id)
  const [editingExpiries, setEditingExpiries] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api<{ items: AdminUser[]; total: number }>(`/admin/users?search=${encodeURIComponent(search)}`),
  });
  const users = data?.items ?? [];

  const { data: userDetail, isPending: isDetailPending } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => api<AdminUserDetail>(`/admin/users/${selectedUserId}`),
    enabled: !!selectedUserId,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses-simple'],
    queryFn: () => api<SimpleCourse[]>('/admin/courses'),
  });

  const enrollMutation = useMutation({
    mutationFn: ({ userId, courseId, validityDays }: { userId: string; courseId: string; validityDays: number }) =>
      api(`/admin/users/${userId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ courseId, validityDays }),
      }),
    onSuccess: async () => {
      setEnrollCourseId('');
      setEnrollValidity('0');
      setEnrollMessage('Student enrolled successfully.');
      await queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setEnrollMessage(null), 4000);
    },
    onError: (error) => {
      setEnrollMessage(error.message);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ userCourseId, status, expiresAt }: { userCourseId: string; status?: string; expiresAt?: string | null }) =>
      api(`/admin/user-courses/${userCourseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, expiresAt }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || !enrollCourseId) return;
    enrollMutation.mutate({
      userId: selectedUserId,
      courseId: enrollCourseId,
      validityDays: Number(enrollValidity) || 0,
    });
  }

  function handleUpdateStatus(userCourseId: string, status: string) {
    updateCourseMutation.mutate({ userCourseId, status });
  }

  function handleSaveExpiry(userCourseId: string) {
    const dateStr = editingExpiries[userCourseId];
    if (dateStr === undefined) return;
    updateCourseMutation.mutate({
      userCourseId,
      expiresAt: dateStr ? new Date(dateStr).toISOString() : null,
    });
  }

  return (
    <div className="admin-page">
      <div className="section-head admin-section-head">
        <span className="eyebrow">Students</span>
        <h1 className="q-h1 page-title">Customer accounts</h1>
        <p>Review student learning metrics, purchase records, and course validity periods.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="admin-search-input"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px solid var(--line)',
            background: 'var(--white)',
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedUserId ? '1fr 420px' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* User list */}
        <div className="dash-card">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Courses</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setEnrollMessage(null);
                    }}
                    style={{
                      cursor: 'pointer',
                      background: selectedUserId === user.id ? 'var(--bg-active)' : undefined,
                    }}
                    className="hover-row"
                  >
                    <td><b>{user.name}</b></td>
                    <td>{user.email}</td>
                    <td>{user.phone ?? '-'}</td>
                    <td><span className="mono-pill">{user.userCourses.length} courses</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User detail sidebar/drawer */}
        {selectedUserId && (
          <aside className="dash-card admin-user-detail-panel" style={{ position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="q-h3">Student Detail</h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
                type="button"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {isDetailPending ? (
              <p className="muted-copy">Loading student files...</p>
            ) : userDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700 }}>{userDetail.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{userDetail.email}</p>
                  <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 4 }}>Joined on {new Date(userDetail.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Course access management */}
                <div>
                  <h5 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>Active Enrollments</h5>
                  
                  {userDetail.userCourses.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No courses enrolled currently.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {userDetail.userCourses.map((uc) => (
                        <div key={uc.id} style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-faint)', fontSize: 13 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>{uc.course.title}</div>
                          
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status:</span>
                            <select
                              value={uc.status}
                              onChange={(e) => handleUpdateStatus(uc.id, e.target.value)}
                              style={{ padding: '2px 6px', fontSize: 12, borderRadius: 4, border: '1px solid var(--line)' }}
                              aria-label="Enrolled status"
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="EXPIRED">Expired</option>
                              <option value="REVOKED">Revoked</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expires:</span>
                            <input
                              type="date"
                              value={
                                editingExpiries[uc.id] !== undefined
                                  ? editingExpiries[uc.id]
                                  : uc.expiresAt
                                  ? new Date(uc.expiresAt).toISOString().slice(0, 10)
                                  : ''
                              }
                              onChange={(e) => setEditingExpiries((prev) => ({ ...prev, [uc.id]: e.target.value }))}
                              style={{ padding: '2px 4px', fontSize: 12, borderRadius: 4, border: '1px solid var(--line)', width: 120 }}
                              aria-label="Expiration date"
                            />
                            <button
                              onClick={() => handleSaveExpiry(uc.id)}
                              className="btn btn-primary"
                              style={{ padding: '2px 8px', fontSize: 11, height: 'auto' }}
                              type="button"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual Enrollment Form */}
                <form onSubmit={handleEnroll} style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 12 }}>Enroll manually</h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }} htmlFor="enroll-course-select">Select Course</label>
                      <select
                        id="enroll-course-select"
                        value={enrollCourseId}
                        onChange={(e) => setEnrollCourseId(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--white)' }}
                      >
                        <option value="">-- Select Course --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }} htmlFor="enroll-validity-input">Validity (Days) <span style={{ color: 'var(--text-faint)' }}>(0 for Lifetime)</span></label>
                      <input
                        id="enroll-validity-input"
                        type="number"
                        min="0"
                        value={enrollValidity}
                        onChange={(e) => setEnrollValidity(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--white)' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!enrollCourseId || enrollMutation.isPending}
                      className="btn btn-primary btn-block"
                      style={{ marginTop: 6 }}
                    >
                      <Plus size={14} /> Enroll Student
                    </button>
                    
                    {enrollMessage && (
                      <p style={{ fontSize: 12, color: enrollMessage.includes('success') ? 'green' : 'red', marginTop: 4 }}>{enrollMessage}</p>
                    )}
                  </div>
                </form>

                {/* Purchase logs */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>Order History</h5>
                  {userDetail.orders.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No purchases found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                      {userDetail.orders.map((o) => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{o.course.title}</div>
                            <div style={{ color: 'var(--text-faint)' }}>{new Date(o.createdAt).toLocaleDateString()} · {o.status}</div>
                          </div>
                          <div style={{ fontWeight: 600 }}>{paise(o.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="muted-copy">User details not found.</p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
