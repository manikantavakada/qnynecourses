import { CoursePlayer } from '@/components/course-player';

export default async function PlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CoursePlayer courseId={courseId} />;
}
