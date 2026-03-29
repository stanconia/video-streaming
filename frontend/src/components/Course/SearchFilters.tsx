import React, { useState } from 'react';
import { SearchFilterValues } from '../../types/course/course.types';

interface SearchFiltersProps {
  subjects: string[];
  values: SearchFilterValues;
  onChange: (values: Partial<SearchFilterValues>) => void;
  onClear: () => void;
  activeFilterCount: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  subjects,
  values,
  onChange,
  onClear,
  activeFilterCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localMinPrice, setLocalMinPrice] = useState(values.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(values.maxPrice);

  // Sync local price inputs when external values change
  React.useEffect(() => { setLocalMinPrice(values.minPrice); }, [values.minPrice]);
  React.useEffect(() => { setLocalMaxPrice(values.maxPrice); }, [values.maxPrice]);

  const handlePriceApply = () => {
    onChange({ minPrice: localMinPrice, maxPrice: localMaxPrice });
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePriceApply();
  };

  const renderStars = (minRating: number) => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <div style={styles.starRow}>
        <span style={styles.starLabel}>Min Rating:</span>
        {stars.map((star) => (
          <button
            key={star}
            onClick={() => onChange({ minRating: values.minRating === star ? 0 : star })}
            style={{
              ...styles.starBtn,
              color: star <= minRating ? '#f59e0b' : '#4b5563',
            }}
            title={`${star} star${star > 1 ? 's' : ''} & up`}
          >
            {star <= minRating ? '\u2605' : '\u2606'}
          </button>
        ))}
        {minRating > 0 && (
          <span style={styles.starText}>{minRating}+ stars</span>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.toggleBtn}
        >
          <span style={styles.toggleIcon}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span style={styles.badge}>{activeFilterCount}</span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={onClear} style={styles.clearAllBtn}>
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div style={styles.body}>
          {/* Row 1: Subject, Difficulty, Sort */}
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Subject</label>
              <select
                value={values.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                style={styles.select}
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Difficulty</label>
              <div style={styles.btnGroup}>
                {[
                  { value: '', label: 'All' },
                  { value: 'BEGINNER', label: 'Beginner' },
                  { value: 'INTERMEDIATE', label: 'Intermediate' },
                  { value: 'ADVANCED', label: 'Advanced' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ difficulty: opt.value })}
                    style={{
                      ...styles.btnGroupItem,
                      backgroundColor: values.difficulty === opt.value ? '#8b5cf6' : '#374151',
                      color: values.difficulty === opt.value ? '#fff' : '#d1d5db',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Sort By</label>
              <select
                value={values.sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value })}
                style={styles.select}
              >
                <option value="newest">Newest</option>
                <option value="title">Title A-Z</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Row 2: Price range, Rating */}
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Price Range</label>
              <div style={styles.priceRow}>
                <span style={styles.currencySign}>$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  style={styles.priceInput}
                  min="0"
                  step="0.01"
                />
                <span style={styles.priceDash}>&ndash;</span>
                <span style={styles.currencySign}>$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  style={styles.priceInput}
                  min="0"
                  step="0.01"
                />
                <button onClick={handlePriceApply} style={styles.applyPriceBtn}>
                  Apply
                </button>
              </div>
            </div>

            <div style={styles.filterGroup}>
              {renderStars(values.minRating)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #374151',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #374151',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#f3f4f6',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: 0,
  },
  toggleIcon: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
  },
  clearAllBtn: {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  body: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    minWidth: '150px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  select: {
    padding: '8px 12px',
    backgroundColor: '#374151',
    color: '#f3f4f6',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  btnGroup: {
    display: 'flex',
    gap: '2px',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  btnGroupItem: {
    padding: '8px 12px',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.15s',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  currencySign: {
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '600',
  },
  priceInput: {
    width: '80px',
    padding: '8px 8px',
    backgroundColor: '#374151',
    color: '#f3f4f6',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  priceDash: {
    color: '#6b7280',
    fontSize: '16px',
    margin: '0 2px',
  },
  applyPriceBtn: {
    padding: '8px 14px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    marginLeft: '4px',
  },
  starRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    paddingTop: '2px',
  },
  starLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginRight: '4px',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
  },
  starText: {
    fontSize: '12px',
    color: '#9ca3af',
    marginLeft: '6px',
  },
};
