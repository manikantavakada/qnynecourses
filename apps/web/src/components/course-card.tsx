import Link from 'next/link';
import { BarChart3, Clock, Code2, Database, Megaphone, Paintbrush, Smartphone } from 'lucide-react';
import { paise } from '@/lib/api';
import type { Course } from '@/types';

const iconMap = [Code2, Paintbrush, Database, Code2, Megaphone, Smartphone];
const bgMap = ['bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5', 'bg-6'];

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const price = course.discountPrice ?? course.price;
  const Icon = iconMap[index % iconMap.length];
  const category = course.category?.name ?? categoryFromTitle(course.title, index);

  return (
    <Link href={`/courses/${course.slug}`} className="course-card" data-category={category}>
      <div className={`course-thumb ${bgMap[index % bgMap.length]}`}>
        <span className="badge-level">{levelLabel(course.level)}</span>
        <span className="badge-price">{price === 0 ? 'Free' : paise(price)}</span>
        <Icon size={46} strokeWidth={1.6} />
      </div>
      <div className="course-body">
        <span className="course-cat">{category}</span>
        <h3 className="q-h3">{course.title}</h3>
        <div className="course-rating">
          <span className="stars">★★★★★</span> 4.{9 - (index % 3)}{' '}
          <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>({862 - index * 73})</span>
        </div>
        <div className="course-meta">
          <span>
            <Clock size={13} /> {course.modules?.length ? `${course.modules.length * 8}h` : '32h'}
          </span>
          <span>
            <BarChart3 size={13} /> {levelLabel(course.level)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function levelLabel(level: Course['level']) {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

function categoryFromTitle(title: string, index: number) {
  if (/design|ui|ux/i.test(title)) return 'Product Design';
  if (/data|sql|analytics/i.test(title)) return 'Data Analytics';
  if (/marketing|instagram|growth/i.test(title)) return 'Marketing';
  if (/mobile|native/i.test(title)) return 'Mobile Development';
  return index % 2 === 0 ? 'Web Development' : 'Product Design';
}
