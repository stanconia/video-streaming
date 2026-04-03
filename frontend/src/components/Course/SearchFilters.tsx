import React, { useState, useMemo } from 'react';
import { SearchFilterValues } from '../../types/course/course.types';
import { COUNTRIES } from '../../data/constants';

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
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const lower = countrySearch.toLowerCase();
    return COUNTRIES.filter((c) => c.toLowerCase().includes(lower));
  }, [countrySearch]);

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
              color: star <= minRating ? 'var(--warning)' : 'var(--text-muted)',
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

            <div style={{ ...styles.filterGroup, position: 'relative' as const }}>
              <label style={styles.label}>Country</label>
              <div style={styles.countryContainer}>
                <input
                  type="text"
                  placeholder={values.country || 'All Countries'}
                  value={countrySearch}
                  onChange={(e) => { setCountrySearch(e.target.value); setIsCountryDropdownOpen(true); }}
                  onFocus={() => setIsCountryDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 200)}
                  style={styles.select}
                />
                {values.country && (
                  <button
                    onClick={() => { onChange({ country: '' }); setCountrySearch(''); }}
                    style={styles.countryClearBtn}
                    title="Clear country filter"
                  >
                    x
                  </button>
                )}
                {isCountryDropdownOpen && (
                  <div style={styles.countryDropdown}>
                    <div
                      style={styles.countryOption}
                      onMouseDown={() => { onChange({ country: '' }); setCountrySearch(''); setIsCountryDropdownOpen(false); }}
                    >
                      All Countries
                    </div>
                    {filteredCountries.map((c) => (
                      <div
                        key={c}
                        style={{
                          ...styles.countryOption,
                          backgroundColor: values.country === c ? 'var(--accent-light)' : 'transparent',
                        }}
                        onMouseDown={() => { onChange({ country: c }); setCountrySearch(''); setIsCountryDropdownOpen(false); }}
                      >
                        {c}
                      </div>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div style={{ ...styles.countryOption, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No countries found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Difficulty</label>
              <div style={styles.btnGroup}>
                {[
                  { value: '', label: 'All' },
                  { value: 'BEGINNER', label: 'Beginner' },
                  { value: 'INTERMEDIATE', label: 'Inter.' },
                  { value: 'ADVANCED', label: 'Advanced' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ difficulty: opt.value })}
                    style={{
                      ...styles.btnGroupItem,
                      backgroundColor: values.difficulty === opt.value ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: values.difficulty === opt.value ? '#fff' : 'var(--text-secondary)',
                      borderColor: values.difficulty === opt.value ? 'var(--accent)' : 'var(--border-color)',
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
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: 0,
  },
  toggleIcon: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
  },
  clearAllBtn: {
    padding: '6px 14px',
    backgroundColor: 'var(--danger)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  body: {
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    minWidth: 0,
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  select: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  btnGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
  },
  btnGroupItem: {
    padding: '7px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  currencySign: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: '600',
  },
  priceInput: {
    width: '70px',
    padding: '10px 8px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  priceDash: {
    color: 'var(--text-muted)',
    fontSize: '16px',
  },
  applyPriceBtn: {
    padding: '10px 14px',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  starRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap' as const,
    paddingTop: '2px',
  },
  starLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
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
    color: 'var(--text-muted)',
    marginLeft: '6px',
  },
  countryContainer: {
    position: 'relative' as const,
    width: '100%',
  },
  countryClearBtn: {
    position: 'absolute' as const,
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  countryDropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200px',
    overflowY: 'auto' as const,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '0 0 8px 8px',
    zIndex: 10,
  },
  countryOption: {
    padding: '10px 12px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
};
