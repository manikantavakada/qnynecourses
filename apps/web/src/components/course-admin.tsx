'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Film, Layers, Pencil, Plus, UploadCloud, Video, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { api, paise } from '@/lib/api';
import type { Course } from '@/types';

type AdminCourse = Course & {
  modules?: Array<{
    id: string;
    title: string;
    position: number;
    videos: Array<{
      id: string;
      title: string;
      position: number;
      sourceKey?: string | null;
      status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
      isPreview: boolean;
    }>;
  }>;
};

type CourseForm = {
  title: string;
  slug: string;
  description: string;
  price: string;
  discountPrice: string;
  validityDays: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  isPublished: boolean;
};

const defaultForm: CourseForm = {
  title: '',
  slug: '',
  description: 'Premium QNYNE course with private video lessons and guided modules.',
  price: '9999',
  discountPrice: '',
  validityDays: '0',
  level: 'BEGINNER',
  language: 'English',
  isPublished: true,
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formFromCourse(course: AdminCourse): CourseForm {
  return {
    title: course.title,
    slug: course.slug,
    description: course.description,
    price: String(Math.round(course.price / 100)),
    discountPrice: course.discountPrice ? String(Math.round(course.discountPrice / 100)) : '',
    validityDays: String(course.validityDays),
    level: course.level,
    language: course.language,
    isPublished: Boolean(course.isPublished),
  };
}

function payloadFromForm(form: CourseForm) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || slugify(form.title),
    description: form.description.trim(),
    price: Math.max(0, Math.round(Number(form.price || 0) * 100)),
    discountPrice: form.discountPrice ? Math.max(0, Math.round(Number(form.discountPrice) * 100)) : undefined,
    validityDays: Math.max(0, Math.round(Number(form.validityDays || 0))),
    level: form.level,
    language: form.language.trim() || 'English',
    isPublished: form.isPublished,
  };
}

export function CourseAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CourseForm>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moduleTitles, setModuleTitles] = useState<Record<string, string>>({});
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});

  // Playlist & Video inline editing states
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoTitle, setEditingVideoTitle] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api<AdminCourse[]>('/admin/courses'),
  });

  const activeCourse = useMemo(() => data.find((course) => course.id === editingId), [data, editingId]);

  const saveCourse = useMutation({
    mutationFn: () => {
      const payload = payloadFromForm(form);
      const path = editingId ? `/admin/courses/${editingId}` : '/admin/courses';
      return api(path, { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      setForm(defaultForm);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const addModule = useMutation({
    mutationFn: ({ courseId, moduleTitle, position }: { courseId: string; moduleTitle: string; position: number }) =>
      api(`/admin/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ title: moduleTitle, position }),
      }),
    onSuccess: async () => {
      setModuleTitles({});
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const updateModule = useMutation({
    mutationFn: ({ moduleId, title }: { moduleId: string; title: string }) =>
      api(`/admin/modules/${moduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    onSuccess: async () => {
      setEditingModuleId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const deleteModule = useMutation({
    mutationFn: (moduleId: string) =>
      api(`/admin/modules/${moduleId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const addVideo = useMutation({
    mutationFn: ({ moduleId, videoTitle, position }: { moduleId: string; videoTitle: string; position: number }) =>
      api(`/admin/modules/${moduleId}/videos`, {
        method: 'POST',
        body: JSON.stringify({ title: videoTitle, position, isPreview: false }),
      }),
    onSuccess: async () => {
      setVideoTitles({});
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const updateVideo = useMutation({
    mutationFn: ({ videoId, title, isPreview }: { videoId: string; title?: string; isPreview?: boolean }) =>
      api(`/admin/videos/${videoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, isPreview }),
      }),
    onSuccess: async () => {
      setEditingVideoId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const deleteVideo = useMutation({
    mutationFn: (videoId: string) =>
      api(`/admin/videos/${videoId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  async function uploadVideo(videoId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadStatus((prev) => ({ ...prev, [videoId]: 'Uploading...' }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api(`/admin/upload/video/local/${videoId}`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
      setUploadStatus((prev) => ({ ...prev, [videoId]: 'READY' }));
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    } catch (error) {
      setUploadStatus((prev) => ({ ...prev, [videoId]: error instanceof Error ? error.message : 'FAILED' }));
    } finally {
      event.target.value = '';
    }
  }

  function startEdit(course: AdminCourse) {
    setEditingId(course.id);
    setForm(formFromCourse(course));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    saveCourse.mutate();
  }

  return (
    <div className="admin-page">
      <div className="section-head admin-section-head">
        <span className="eyebrow">Course studio</span>
        <h1 className="q-h1 page-title">Courses, playlists, and videos</h1>
        <p>Create customer-facing courses, add playlist modules, attach video lessons, and upload source videos for processing.</p>
      </div>

      <form className="dash-card admin-form" onSubmit={submit}>
        <div className="admin-form-head">
          <h2 className="q-h3">{editingId ? 'Edit course details' : 'Create a new course'}</h2>
          {editingId ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setEditingId(null); setForm(defaultForm); }}>Cancel edit</button> : null}
        </div>
        <div className="admin-form-grid">
          <div className="field">
            <label htmlFor="title">Course title</label>
            <input id="title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} />
          </div>
          <div className="field">
            <label htmlFor="slug">URL slug</label>
            <input id="slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} />
          </div>
          <div className="field wide">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} />
          </div>
          <div className="field">
            <label htmlFor="price">Price INR</label>
            <input id="price" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} inputMode="numeric" />
          </div>
          <div className="field">
            <label htmlFor="discount">Discount INR</label>
            <input id="discount" value={form.discountPrice} onChange={(event) => setForm((current) => ({ ...current, discountPrice: event.target.value }))} inputMode="numeric" />
          </div>
          <div className="field">
            <label htmlFor="level">Level</label>
            <select id="level" value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value as CourseForm['level'] }))}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="validity">Validity days</label>
            <input id="validity" value={form.validityDays} onChange={(event) => setForm((current) => ({ ...current, validityDays: event.target.value }))} inputMode="numeric" />
          </div>
          <div className="field">
            <label htmlFor="language">Language</label>
            <input id="language" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} />
          </div>
          <label className="toggle-row">
            <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
            Publish to customer website
          </label>
        </div>
        {saveCourse.error ? <div className="form-error">{saveCourse.error.message}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={saveCourse.isPending}>
          {editingId ? <Check size={16} /> : <Plus size={16} />}
          {saveCourse.isPending ? 'Saving...' : editingId ? 'Save course' : 'Create course'}
        </button>
      </form>

      {isLoading ? <p className="muted-copy">Loading courses...</p> : null}

      <div className="admin-course-list">
        {data.map((course) => {
          const modules = course.modules ?? [];
          return (
            <article key={course.id} className={`dash-card admin-course-card ${activeCourse?.id === course.id ? 'editing' : ''}`}>
              <div className="admin-course-head">
                <div>
                  <span className="course-cat">{course.isPublished ? 'Published' : 'Draft'}</span>
                  <h2 className="q-h3">{course.title}</h2>
                  <p>{paise(course.discountPrice ?? course.price)} · {course.level} · {modules.length} playlists</p>
                </div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(course)}>
                  <Pencil size={15} /> Edit details
                </button>
              </div>

              <form
                className="admin-inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const moduleTitle = moduleTitles[course.id]?.trim();
                  if (moduleTitle) addModule.mutate({ courseId: course.id, moduleTitle, position: modules.length + 1 });
                }}
              >
                <input value={moduleTitles[course.id] ?? ''} onChange={(event) => setModuleTitles((current) => ({ ...current, [course.id]: event.target.value }))} placeholder="New playlist/module title" />
                <button className="btn btn-ghost btn-sm" type="submit"><Layers size={15} /> Add playlist</button>
              </form>

              <div className="admin-module-list">
                {modules.map((module) => (
                  <div key={module.id} className="admin-module-card">
                    <div className="admin-module-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {editingModuleId === module.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            style={{ padding: '2px 6px', fontSize: 13, borderRadius: 4, border: '1px solid var(--line)' }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateModule.mutate({ moduleId: module.id, title: editingModuleTitle })}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingModuleId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <b>{module.position}. {module.title}</b>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 4 }}
                            onClick={() => { setEditingModuleId(module.id); setEditingModuleTitle(module.title); }}
                            type="button"
                            aria-label="Edit playlist title"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 4, color: 'var(--rose)' }}
                            onClick={() => { if (confirm('Delete this playlist and all its videos?')) deleteModule.mutate(module.id); }}
                            type="button"
                            aria-label="Delete playlist"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      <span>{module.videos.length} videos</span>
                    </div>

                    <div className="admin-video-list">
                      {module.videos.map((videoItem) => (
                        <div key={videoItem.id} className="admin-video-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <Film size={15} style={{ flexShrink: 0 }} />
                            {editingVideoId === videoItem.id ? (
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input
                                  value={editingVideoTitle}
                                  onChange={(e) => setEditingVideoTitle(e.target.value)}
                                  style={{ padding: '2px 6px', fontSize: 12, borderRadius: 4, border: '1px solid var(--line)', width: 160 }}
                                />
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '2px 6px', height: 'auto' }}
                                  onClick={() => updateVideo.mutate({ videoId: videoItem.id, title: editingVideoTitle })}
                                  type="button"
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '2px 6px', height: 'auto' }}
                                  onClick={() => setEditingVideoId(null)}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13 }}>{videoItem.title}</span>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: 2 }}
                                  onClick={() => { setEditingVideoId(videoItem.id); setEditingVideoTitle(videoItem.title); }}
                                  type="button"
                                  aria-label="Edit video title"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: 2, color: 'var(--rose)' }}
                                  onClick={() => { if (confirm('Delete this video lesson?')) deleteVideo.mutate(videoItem.id); }}
                                  type="button"
                                  aria-label="Delete video"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                              <input
                                type="checkbox"
                                checked={videoItem.isPreview}
                                onChange={(e) => updateVideo.mutate({ videoId: videoItem.id, isPreview: e.target.checked })}
                              />
                              Preview
                            </label>
                            <small className="mono-pill" style={{ fontSize: 11 }}>{uploadStatus[videoItem.id] ?? videoItem.status}</small>
                            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                              <UploadCloud size={14} /> Upload
                              <input type="file" accept="video/*" hidden onChange={(event) => void uploadVideo(videoItem.id, event)} />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      className="admin-inline-form compact"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const videoTitle = videoTitles[module.id]?.trim();
                        if (videoTitle) addVideo.mutate({ moduleId: module.id, videoTitle, position: module.videos.length + 1 });
                      }}
                    >
                      <input value={videoTitles[module.id] ?? ''} onChange={(event) => setVideoTitles((current) => ({ ...current, [module.id]: event.target.value }))} placeholder="New video lesson title" />
                      <button className="btn btn-primary btn-sm" type="submit"><Video size={15} /> Add video</button>
                    </form>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
