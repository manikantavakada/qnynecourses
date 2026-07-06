'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { VideoPlayer } from './video-player';
import type { CourseModule } from '@/types';

type MyCourse = {
  course: {
    id: string;
    title: string;
    modules: CourseModule[];
  };
};

export function CoursePlayer({ courseId }: { courseId: string }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const { data = [], isLoading: isCoursesLoading } = useQuery({ queryKey: ['my-courses'], queryFn: () => api<MyCourse[]>('/me/courses') });
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api<{ name: string; email: string }>('/users/me'),
  });

  const item = data.find((row) => row.course.id === courseId);
  const firstVideo = item?.course.modules.flatMap((module) => module.videos).find((video) => video.status === 'READY' || video.isPreview);
  
  const activeVideo = item?.course.modules
    .flatMap((module) => module.videos)
    .find((video) => video.id === activeVideoId) || firstVideo;

  const isLoading = isCoursesLoading || isUserLoading;

  if (isLoading) return <p className="text-sm text-neutral-600">Loading player...</p>;
  if (!item) return <p className="rounded border border-line bg-white p-4 text-sm text-neutral-600">Course access was not found.</p>;

  const userLabel = user ? `${user.name} (${user.email})` : 'Student';

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded border border-line bg-white p-4">
        <h1 className="font-semibold" style={{ fontSize: 16, marginBottom: 12 }}>{item.course.title}</h1>
        <div className="mt-4 grid gap-4">
          {item.course.modules.map((module) => (
            <div key={module.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              <p className="text-sm font-semibold" style={{ marginBottom: 8, color: 'var(--ink)' }}>{module.title}</p>
              <div className="grid gap-1">
                {module.videos.map((video) => {
                  const isSelected = activeVideo?.id === video.id;
                  const isLocked = video.status !== 'READY' && !video.isPreview;
                  return (
                    <button
                      key={video.id}
                      className={`text-left text-xs w-full p-2 rounded transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                      style={{ border: 'none', background: isSelected ? 'var(--indigo-soft)' : 'transparent', color: isSelected ? 'var(--indigo)' : undefined, cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1 }}
                      onClick={() => {
                        if (!isLocked) {
                          setActiveVideoId(video.id);
                        }
                      }}
                      type="button"
                    >
                      {video.title} {isLocked ? `(${video.status})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
      {activeVideo ? (
        <VideoPlayer key={activeVideo.id} videoId={activeVideo.id} userLabel={userLabel} />
      ) : (
        <div className="rounded border border-line bg-white p-4">No ready video is available.</div>
      )}
    </div>
  );
}
