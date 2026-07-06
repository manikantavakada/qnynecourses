const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const categories = [
  { name: 'Web Development', slug: 'web-development' },
  { name: 'Product Design', slug: 'product-design' },
  { name: 'Data Analytics', slug: 'data-analytics' },
  { name: 'Marketing', slug: 'marketing' },
  { name: 'Mobile Development', slug: 'mobile-development' },
];

const courses = [
  {
    title: 'Full-Stack Web Development with the MERN Stack',
    slug: 'full-stack-web-development-mern-stack',
    description:
      'Build and deploy production-ready applications with MongoDB, Express, React and Node through project-based lessons.',
    price: 499900,
    level: 'INTERMEDIATE',
    categorySlug: 'web-development',
    modules: [
      ['Getting started with the MERN stack', ["What you'll build in this course", 'Setting up Node, npm and your editor', 'Repo structure and project conventions']],
      ['Building the Express + MongoDB API', ['Designing the schema in MongoDB', 'REST routes, controllers and middleware', 'JWT authentication from scratch']],
      ['React front-end and state management', ['Component architecture that scales', 'Connecting React Query to your API']],
      ['Deploying to production', ['Environment config and secrets', 'Shipping to production']],
    ],
  },
  {
    title: 'UI/UX Design Foundations',
    slug: 'ui-ux-design-foundations',
    description:
      'Move from blank canvas to polished product screens with research, wireframes, visual hierarchy and portfolio projects.',
    price: 349900,
    level: 'BEGINNER',
    categorySlug: 'product-design',
    modules: [['Design thinking foundations', ['Understanding user problems', 'Wireframes and flows', 'Portfolio presentation']]],
  },
  {
    title: 'SQL & Data Analytics for Decision Making',
    slug: 'sql-data-analytics-decision-making',
    description:
      'Learn SQL, dashboards, metrics and analysis workflows that help teams make sharper business decisions.',
    price: 399900,
    level: 'INTERMEDIATE',
    categorySlug: 'data-analytics',
    modules: [['Querying real business data', ['SELECT, filters and joins', 'Aggregations and reporting', 'Dashboard-ready analysis']]],
  },
  {
    title: 'Advanced JavaScript & Modern Web APIs',
    slug: 'advanced-javascript-modern-web-apis',
    description:
      'Master advanced JavaScript patterns, browser APIs and performance techniques for modern web applications.',
    price: 299900,
    level: 'ADVANCED',
    categorySlug: 'web-development',
    modules: [['Modern JavaScript internals', ['The event loop explained', 'Web APIs in practice', 'Performance patterns']]],
  },
  {
    title: 'Instagram Growth & Content Strategy 2026',
    slug: 'instagram-growth-content-strategy-2026',
    description:
      'Plan content, grow an audience and build campaign systems for modern social media brands.',
    price: 0,
    level: 'BEGINNER',
    categorySlug: 'marketing',
    modules: [['Content strategy basics', ['Choosing your content pillars', 'Campaign planning', 'Measuring content performance']]],
  },
  {
    title: 'React Native: Build Cross-Platform Apps',
    slug: 'react-native-build-cross-platform-apps',
    description:
      'Build production-ready iOS and Android apps with React Native, navigation, native APIs and release workflows.',
    price: 449900,
    level: 'ADVANCED',
    categorySlug: 'mobile-development',
    modules: [['React Native foundations', ['Project setup and navigation', 'Native APIs', 'Release workflows']]],
  },
];

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qnyne.local' },
    update: { role: 'ADMIN' },
    create: {
      name: 'QNYNE Admin',
      email: 'admin@qnyne.local',
      passwordHash: await argon2.hash('Admin@12345'),
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const categoryMap = new Map();
  for (const category of categories) {
    const row = await prisma.courseCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryMap.set(category.slug, row.id);
  }

  for (const course of courses) {
    const row = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        price: course.price,
        discountPrice: null,
        validityDays: 0,
        level: course.level,
        language: 'English',
        isPublished: true,
        categoryId: categoryMap.get(course.categorySlug),
      },
      create: {
        title: course.title,
        slug: course.slug,
        description: course.description,
        price: course.price,
        validityDays: 0,
        level: course.level,
        language: 'English',
        isPublished: true,
        categoryId: categoryMap.get(course.categorySlug),
        createdById: admin.id,
      },
    });

    await prisma.courseModule.deleteMany({ where: { courseId: row.id } });
    for (const [moduleIndex, [moduleTitle, lessons]] of course.modules.entries()) {
      await prisma.courseModule.create({
        data: {
          courseId: row.id,
          title: moduleTitle,
          position: moduleIndex + 1,
          videos: {
            create: lessons.map((title, videoIndex) => ({
              title,
              position: videoIndex + 1,
              isPreview: videoIndex === 0,
              status: 'READY',
              durationSeconds: 600 + videoIndex * 240,
              hlsMasterKey: `demo/${course.slug}/${videoIndex + 1}/master.m3u8`,
            })),
          },
        },
      });
    }
  }

  console.log('Seeded QNYNE courses. Admin login: admin@qnyne.local / Admin@12345');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
