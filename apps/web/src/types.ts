export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  validityDays: number;
  isPublished?: boolean;
  category?: { id: string; name: string; slug: string } | null;
  modules?: CourseModule[];
  reviews?: Array<{ rating: number; comment?: string; user?: { name: string } }>;
};

export type CourseModule = {
  id: string;
  title: string;
  position: number;
  videos: CourseVideo[];
};

export type CourseVideo = {
  id: string;
  title: string;
  position: number;
  durationSeconds?: number;
  isPreview: boolean;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
};
