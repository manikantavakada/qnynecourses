import type { Course } from '@/types';

export const sampleCourses: Course[] = [
  {
    id: 'sample-mern',
    title: 'Full-Stack Web Development with the MERN Stack',
    slug: 'full-stack-web-development-mern-stack',
    description:
      'Build and deploy production-ready applications with MongoDB, Express, React and Node through project-based lessons.',
    price: 499900,
    level: 'INTERMEDIATE',
    language: 'English',
    validityDays: 0,
    category: { id: 'cat-web', name: 'Web Development', slug: 'web-development' },
    modules: [
      {
        id: 'mern-1',
        title: 'Getting started with the MERN stack',
        position: 1,
        videos: [
          { id: 'mern-1-1', title: "What you'll build in this course", position: 1, isPreview: true, status: 'READY' },
          { id: 'mern-1-2', title: 'Setting up Node, npm and your editor', position: 2, isPreview: false, status: 'READY' },
          { id: 'mern-1-3', title: 'Repo structure and project conventions', position: 3, isPreview: false, status: 'READY' },
        ],
      },
      {
        id: 'mern-2',
        title: 'Building the Express + MongoDB API',
        position: 2,
        videos: [
          { id: 'mern-2-1', title: 'Designing the schema in MongoDB', position: 1, isPreview: false, status: 'READY' },
          { id: 'mern-2-2', title: 'REST routes, controllers and middleware', position: 2, isPreview: false, status: 'READY' },
          { id: 'mern-2-3', title: 'JWT authentication from scratch', position: 3, isPreview: false, status: 'READY' },
        ],
      },
      {
        id: 'mern-3',
        title: 'React front-end and state management',
        position: 3,
        videos: [
          { id: 'mern-3-1', title: 'Component architecture that scales', position: 1, isPreview: false, status: 'READY' },
          { id: 'mern-3-2', title: 'Connecting React Query to your API', position: 2, isPreview: false, status: 'READY' },
        ],
      },
    ],
  },
  {
    id: 'sample-design',
    title: 'UI/UX Design Foundations',
    slug: 'ui-ux-design-foundations',
    description:
      'Move from blank canvas to polished product screens with research, wireframes, visual hierarchy and portfolio projects.',
    price: 349900,
    level: 'BEGINNER',
    language: 'English',
    validityDays: 0,
    category: { id: 'cat-design', name: 'Product Design', slug: 'product-design' },
    modules: [
      {
        id: 'design-1',
        title: 'Design thinking foundations',
        position: 1,
        videos: [
          { id: 'design-1-1', title: 'Understanding user problems', position: 1, isPreview: true, status: 'READY' },
          { id: 'design-1-2', title: 'Wireframes and flows', position: 2, isPreview: false, status: 'READY' },
        ],
      },
    ],
  },
  {
    id: 'sample-sql',
    title: 'SQL & Data Analytics for Decision Making',
    slug: 'sql-data-analytics-decision-making',
    description:
      'Learn SQL, dashboards, metrics and analysis workflows that help teams make sharper business decisions.',
    price: 399900,
    level: 'INTERMEDIATE',
    language: 'English',
    validityDays: 365,
    category: { id: 'cat-data', name: 'Data Analytics', slug: 'data-analytics' },
    modules: [
      {
        id: 'sql-1',
        title: 'Querying real business data',
        position: 1,
        videos: [
          { id: 'sql-1-1', title: 'SELECT, filters and joins', position: 1, isPreview: true, status: 'READY' },
          { id: 'sql-1-2', title: 'Aggregations and reporting', position: 2, isPreview: false, status: 'READY' },
        ],
      },
    ],
  },
  {
    id: 'sample-js',
    title: 'Advanced JavaScript & Modern Web APIs',
    slug: 'advanced-javascript-modern-web-apis',
    description:
      'Master advanced JavaScript patterns, browser APIs and performance techniques for modern web applications.',
    price: 299900,
    level: 'ADVANCED',
    language: 'English',
    validityDays: 180,
    category: { id: 'cat-web', name: 'Web Development', slug: 'web-development' },
    modules: [
      {
        id: 'js-1',
        title: 'Modern JavaScript internals',
        position: 1,
        videos: [
          { id: 'js-1-1', title: 'The event loop explained', position: 1, isPreview: true, status: 'READY' },
        ],
      },
    ],
  },
  {
    id: 'sample-marketing',
    title: 'Instagram Growth & Content Strategy 2026',
    slug: 'instagram-growth-content-strategy-2026',
    description:
      'Plan content, grow an audience and build campaign systems for modern social media brands.',
    price: 0,
    level: 'BEGINNER',
    language: 'English',
    validityDays: 0,
    category: { id: 'cat-marketing', name: 'Marketing', slug: 'marketing' },
    modules: [
      {
        id: 'marketing-1',
        title: 'Content strategy basics',
        position: 1,
        videos: [
          { id: 'marketing-1-1', title: 'Choosing your content pillars', position: 1, isPreview: true, status: 'READY' },
        ],
      },
    ],
  },
  {
    id: 'sample-native',
    title: 'React Native: Build Cross-Platform Apps',
    slug: 'react-native-build-cross-platform-apps',
    description:
      'Build production-ready iOS and Android apps with React Native, navigation, native APIs and release workflows.',
    price: 449900,
    level: 'ADVANCED',
    language: 'English',
    validityDays: 365,
    category: { id: 'cat-mobile', name: 'Mobile Development', slug: 'mobile-development' },
    modules: [
      {
        id: 'native-1',
        title: 'React Native foundations',
        position: 1,
        videos: [
          { id: 'native-1-1', title: 'Project setup and navigation', position: 1, isPreview: true, status: 'READY' },
        ],
      },
    ],
  },
];

export function findSampleCourse(slug: string) {
  return sampleCourses.find((course) => course.slug === slug);
}
