import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CourseCard } from './CourseCard';
import { api } from '../../lib/api/client';
import { STATIC_COURSES, STATIC_CATEGORIES } from '../../data/static-courses';

/* ------------------------------------------------------------------ */
/*  Contract types (inline — not importable from contracts in client)  */
/* ------------------------------------------------------------------ */

interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: { id: string; name: string; slug: string };
  difficulty_level: 'foundational' | 'working' | 'applied';
  estimated_duration_minutes: number;
  cpd_hours: number | null;
  professional_body: string | null;
  lesson_count: number;
  module_count: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  course_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CourseListResponse {
  courses: CourseSummary[];
  pagination: Pagination;
}

interface CategoryListResponse {
  categories: CategoryItem[];
}

/* ------------------------------------------------------------------ */
/*  Skeleton helpers                                                   */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="h-40 rounded-t-lg bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PER_PAGE = 12;

export function CourseCatalog() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedDifficulty]);

  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Client-side filter/paginate for static data
  const staticResult = useMemo(() => {
    let filtered = STATIC_COURSES as CourseSummary[];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((c) => c.category.slug === selectedCategory);
    }
    if (selectedDifficulty) {
      filtered = filtered.filter((c) => c.difficulty_level === selectedDifficulty);
    }
    filtered.sort((a, b) => a.title.localeCompare(b.title));
    const start = (page - 1) * PER_PAGE;
    return { items: filtered.slice(start, start + PER_PAGE), total: filtered.length };
  }, [debouncedSearch, selectedCategory, selectedDifficulty, page]);

  // Probe API availability once on mount
  useEffect(() => {
    let cancelled = false;
    api.get<CategoryListResponse>('/categories')
      .then((data) => {
        if (!cancelled && data?.categories?.length > 0) {
          setCategories(data.categories);
          setApiAvailable(true);
        } else {
          throw new Error('empty');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories(STATIC_CATEGORIES);
          setApiAvailable(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Load courses — static immediately, API if available
  useEffect(() => {
    if (apiAvailable === null) {
      // Still probing — show static data immediately (no loading spinner)
      setCourses(staticResult.items);
      setTotal(staticResult.total);
      setLoading(false);
      return;
    }

    if (!apiAvailable) {
      setCourses(staticResult.items);
      setTotal(staticResult.total);
      setLoading(false);
      return;
    }

    // API is available — fetch live data
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(PER_PAGE));
    if (debouncedSearch) params.set('query', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty);

    api.get<CourseListResponse>(`/courses?${params.toString()}`)
      .then((body) => {
        if (!cancelled && body?.courses?.length >= 0) {
          setCourses(body.courses);
          setTotal(body.pagination.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCourses(staticResult.items);
          setTotal(staticResult.total);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [apiAvailable, page, debouncedSearch, selectedCategory, selectedDifficulty, staticResult]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const filterCounts = useMemo(() => {
    if (apiAvailable) {
      const catCounts: Record<string, number> = {};
      for (const cat of categories) {
        catCounts[cat.slug] = cat.course_count;
      }
      const totalCourses = categories.reduce((sum, cat) => sum + cat.course_count, 0);
      const diffCounts: Record<string, number> = { foundational: 0, working: 0, applied: 0 };
      for (const c of courses) {
        diffCounts[c.difficulty_level] = (diffCounts[c.difficulty_level] || 0) + 1;
      }
      return { catCounts, diffCounts, totalForCat: totalCourses, totalForDiff: total };
    }

    const all = STATIC_COURSES as CourseSummary[];
    const q = debouncedSearch.toLowerCase();
    const afterSearch = debouncedSearch
      ? all.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      : all;

    const afterSearchAndDifficulty = selectedDifficulty
      ? afterSearch.filter((c) => c.difficulty_level === selectedDifficulty)
      : afterSearch;

    const afterSearchAndCategory = selectedCategory
      ? afterSearch.filter((c) => c.category.slug === selectedCategory)
      : afterSearch;

    const catCounts: Record<string, number> = {};
    for (const c of afterSearchAndDifficulty) {
      catCounts[c.category.slug] = (catCounts[c.category.slug] || 0) + 1;
    }

    const diffCounts: Record<string, number> = { foundational: 0, working: 0, applied: 0 };
    for (const c of afterSearchAndCategory) {
      diffCounts[c.difficulty_level] = (diffCounts[c.difficulty_level] || 0) + 1;
    }

    return { catCounts, diffCounts, totalForCat: afterSearchAndDifficulty.length, totalForDiff: afterSearchAndCategory.length };
  }, [debouncedSearch, selectedCategory, selectedDifficulty, apiAvailable, categories, total]);

  return (
    <section className="px-4 py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Catalog</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">All Categories ({filterCounts.totalForCat})</option>
          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name} ({filterCounts.catCounts[cat.slug] || 0})
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">All Levels ({filterCounts.totalForDiff})</option>
          <option value="foundational">Foundational ({filterCounts.diffCounts.foundational})</option>
          <option value="working">Working ({filterCounts.diffCounts.working})</option>
          <option value="applied">Applied ({filterCounts.diffCounts.applied})</option>
        </select>

        <span className="sm:ml-auto text-sm font-medium text-gray-600">{total} course{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="h-16 w-16 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <p className="text-gray-500 text-sm">
            No courses found. Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <nav
          className="flex items-center justify-between mt-8"
          aria-label="Course pagination"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
