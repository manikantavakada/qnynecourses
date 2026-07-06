'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  author?: { name: string };
};

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  isPublished: boolean;
};

const emptyBlog: BlogForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverUrl: '',
  isPublished: true,
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function BlogAdmin() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyBlog);
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => api<Blog[]>('/admin/blogs'),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        coverUrl: form.coverUrl.trim() || undefined,
        isPublished: form.isPublished,
      };
      return api(editingId ? `/admin/blogs/${editingId}` : '/admin/blogs', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setForm(emptyBlog);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    },
  });

  function edit(blog: Blog) {
    setEditingId(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverUrl: blog.coverUrl ?? '',
      isPublished: blog.isPublished,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    save.mutate();
  }

  return (
    <div className="admin-page">
      <div className="section-head admin-section-head">
        <span className="eyebrow">Blog studio</span>
        <h1 className="q-h1 page-title">Blogs and founder notes</h1>
        <p>Create and publish editorial content from the admin panel.</p>
      </div>

      <form className="dash-card admin-form" onSubmit={submit}>
        <div className="admin-form-head">
          <h2 className="q-h3">{editingId ? 'Edit blog' : 'Create blog'}</h2>
          {editingId ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setEditingId(null); setForm(emptyBlog); }}>Cancel edit</button> : null}
        </div>
        <div className="admin-form-grid">
          <div className="field">
            <label htmlFor="blog-title">Title</label>
            <input id="blog-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} />
          </div>
          <div className="field">
            <label htmlFor="blog-slug">Slug</label>
            <input id="blog-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} />
          </div>
          <div className="field wide">
            <label htmlFor="blog-excerpt">Excerpt</label>
            <textarea id="blog-excerpt" rows={3} value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} />
          </div>
          <div className="field wide">
            <label htmlFor="blog-content">Content</label>
            <textarea id="blog-content" rows={8} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
          </div>
          <div className="field wide">
            <label htmlFor="blog-cover">Cover image URL</label>
            <input id="blog-cover" value={form.coverUrl} onChange={(event) => setForm((current) => ({ ...current, coverUrl: event.target.value }))} />
          </div>
          <label className="toggle-row">
            <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
            Publish blog
          </label>
        </div>
        {save.error ? <div className="form-error">{save.error.message}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={save.isPending}>
          {editingId ? <Check size={16} /> : <Plus size={16} />}
          {save.isPending ? 'Saving...' : editingId ? 'Save blog' : 'Create blog'}
        </button>
      </form>

      {isLoading ? <p className="muted-copy">Loading blogs...</p> : null}
      <div className="stack-list">
        {data.map((blog) => (
          <article className="dash-card media-row" key={blog.id}>
            <span className="media-icon">{blog.title.slice(0, 1)}</span>
            <div>
              <span className="course-cat">{blog.isPublished ? 'Published' : 'Draft'}</span>
              <h2 className="q-h3">{blog.title}</h2>
              <p>{blog.excerpt}</p>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => edit(blog)}>
              <Pencil size={15} /> Edit
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
