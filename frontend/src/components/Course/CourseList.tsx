import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CourseSearchResponse } from '../../types/course/course.types';
import { courseApi } from '../../services/api/course/CourseApi';

export const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [result, setResult] = useState<CourseSearchResponse | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read filters from URL
  const q = searchParams.get('q') || '';
  const subject = searchParams.get('subject') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = parseInt(searchParams.get('page') || '0', 10);

  // Local input state for search (submit on Enter/button)
  const [searchInput, setSearchInput] = useState(q);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  useEffect(() => {
    courseApi.getSubjects().then(setSubjects).catch(() => {});
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await courseApi.searchCourses({
        q: q || undefined,
        subject: subject || undefined,
        difficulty: difficulty || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy,
        page,
        size: 12,
      });
      setResult(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [q, subject, difficulty, minPrice, maxPrice, sortBy, page]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Sync local inputs when URL params change externally
  useEffect(() => { setSearchInput(q); }, [q]);
  useEffect(() => { setMinPriceInput(minPrice); }, [minPrice]);
  useEffect(() => { setMaxPriceInput(maxPrice); }, [maxPrice]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 0 when filters change (unless page itself is being set)
    if (!('page' in updates)) {
      params.delete('page');
    }
    setSearchParams(params);
  };

  const handleSearch = () => {
    updateParams({ q: searchInput.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePriceApply = () => {
    updateParams({
      minPrice: minPriceInput ? String(Math.round(Number(minPriceInput) * 100)) : '',
      maxPrice: maxPriceInput ? String(Math.round(Number(maxPriceInput) * 100)) : '',
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const handleTagClick = (tag: string) => {
    setSearchInput(tag);
    updateParams({ q: tag });
  };

  const courses = result?.content || [];
  const totalElements = result?.totalElements || 0;
  const totalPages = result?.totalPages || 0;
  const startItem = totalElements > 0 ? page * 12 + 1 : 0;
  const endItem = Math.min((page + 1) * 12, totalElements);
  const hasFilters = q || subject || difficulty || minPrice || maxPrice || sortBy !== 'newest';

  const getDifficultyBadge = (level: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      BEGINNER: { bg: '#d4edda', text: '#155724' },
      INTERMEDIATE: { bg: '#fff3cd', text: '#856404' },
      ADVANCED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colorMap[level] || { bg: '#e2e3e5', text: '#383d41' };
    return (
      <span
        style={{
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        {level}
      </span>
    );
  };

  return (
    <div style={styles.container} className="page-container">
      <h1 style={styles.pageTitle}>Browse Courses</h1>

      {/* Search row */}
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search courses by title, subject, teacher, or tags..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.searchInput}
        />
        <button onClick={handleSearch} style={styles.searchBtn}>Search</button>
      </div>

      {/* Filter row */}
      <div style={styles.filters}>
        <select
          value={subject}
          onChange={(e) => updateParams({ subject: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) => updateParams({ difficulty: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="">All Levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>

        <div style={styles.priceRange}>
          <input
            type="number"
            placeholder="Min $"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            style={styles.priceInput}
            min="0"
            step="0.01"
          />
          <span style={{ color: '#666' }}>-</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            style={styles.priceInput}
            min="0"
            step="0.01"
          />
          <button onClick={handlePriceApply} style={styles.priceBtn}>Apply</button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => updateParams({ sortBy: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="newest">Newest</option>
          <option value="title">Title A-Z</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} style={styles.clearBtn}>Clear Filters</button>
        )}
      </div>

      {/* Results summary */}
      {!loading && totalElements > 0 && (
        <div style={styles.resultsSummary}>
          Showing {startItem}-{endItem} of {totalElements} courses
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={styles.empty}>
          No courses found.
          {hasFilters && (
            <div style={{ marginTop: '12px' }}>
              <button onClick={clearFilters} style={styles.clearBtn}>Clear Filters</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {courses.map((course) => (
              <div
                key={course.id}
                style={styles.card}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    style={styles.thumbnail}
                  />
                )}
                {!course.thumbnailUrl && (
                  <div style={styles.thumbnailPlaceholder}>
                    <span style={styles.thumbnailText}>{course.subject || 'Course'}</span>
                  </div>
                )}
                <div style={styles.cardBody}>
                  <div style={styles.cardTitleRow}>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    {course.difficultyLevel && getDifficultyBadge(course.difficultyLevel)}
                  </div>
                  <div
                    style={styles.teacherName}
                    onClick={(e) => { e.stopPropagation(); navigate(`/teachers/${course.teacherUserId}`); }}
                  >
                    {course.teacherDisplayName}
                  </div>
                  <div style={styles.detailsGrid}>
                    <div style={styles.detail}>
                      <span style={styles.label}>Subject:</span>
                      <span>{course.subject}</span>
                    </div>
                    <div style={styles.detail}>
                      <span style={styles.label}>Hours:</span>
                      <span>{course.estimatedHours}h</span>
                    </div>
                    <div style={styles.detail}>
                      <span style={styles.label}>Enrolled:</span>
                      <span>{course.enrolledCount}</span>
                    </div>
                    {course.averageRating != null && course.averageRating > 0 && (
                      <div style={styles.detail}>
                        <span style={styles.label}>Rating:</span>
                        <span>{course.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  {course.tags && (
                    <div style={styles.tagsRow}>
                      {course.tags.split(',').map((tag) => (
                        <span
                          key={tag.trim()}
                          style={styles.tag}
                          onClick={(e) => { e.stopPropagation(); handleTagClick(tag.trim()); }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={styles.priceRow}>
                    <span style={styles.price}>
                      {course.price > 0
                        ? `$${(course.price / 100).toFixed(2)}`
                        : 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page === 0}
                style={{ ...styles.pageBtn, opacity: page === 0 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={!result?.hasNext}
                style={{ ...styles.pageBtn, opacity: !result?.hasNext ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  searchRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  searchBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  filters: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const, alignItems: 'center' },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  priceRange: { display: 'flex', gap: '6px', alignItems: 'center' },
  priceInput: {
    width: '80px',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
  },
  priceBtn: {
    padding: '8px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '8px 14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  resultsSummary: { fontSize: '13px', color: '#666', marginBottom: '16px' },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  thumbnail: {
    width: '100%',
    height: '180px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '180px',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: { fontSize: '18px', color: '#868e96', fontWeight: 'bold' },
  cardBody: { padding: '16px' },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '4px',
  },
  courseTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold' },
  teacherName: { fontSize: '13px', color: '#007bff', marginBottom: '12px', cursor: 'pointer' },
  detailsGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px 16px', marginBottom: '8px' },
  detail: { fontSize: '13px' },
  label: { color: '#666', fontWeight: 'bold', marginRight: '4px' },
  tagsRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '8px' },
  tag: {
    padding: '2px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#495057',
    cursor: 'pointer',
  },
  priceRow: { borderTop: '1px solid #eee', paddingTop: '10px' },
  price: { fontWeight: 'bold', color: '#28a745', fontSize: '16px' },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '32px',
    paddingBottom: '20px',
  },
  pageBtn: {
    padding: '8px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pageInfo: { fontSize: '14px', color: '#666' },
};
