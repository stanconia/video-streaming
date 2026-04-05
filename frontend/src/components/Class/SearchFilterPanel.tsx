import React, { useState } from 'react';
import { SearchFilters } from '../../types/admin/search.types';
import { SubjectSelector } from '../shared/SubjectSelector';

interface SearchFilterPanelProps {
  onSearch: (filters: SearchFilters) => void;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({ onSearch }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    subject: '',
    sortBy: 'date',
    sortDir: 'asc',
    page: 0,
    size: 12,
  });
  const [expanded, setExpanded] = useState(false);

  const handleSearch = () => {
    onSearch({ ...filters, page: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const update = (partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainRow}>
        <input
          type="text"
          placeholder="Search classes..."
          value={filters.query || ''}
          onChange={(e) => update({ query: e.target.value })}
          onKeyDown={handleKeyDown}
          style={styles.searchInput}
        />
        <div style={styles.subjectInput}>
          <SubjectSelector
            value={filters.subject || ''}
            onChange={(value) => update({ subject: value })}
            placeholder="Subject"
          />
        </div>
        <button onClick={handleSearch} style={styles.searchButton}>Search</button>
        <button onClick={() => setExpanded(!expanded)} style={styles.filterToggle}>
          {expanded ? 'Less Filters' : 'More Filters'}
        </button>
      </div>

      {expanded && (
        <div style={styles.advancedRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Price Range</label>
            <div style={styles.rangeInputs}>
              <input type="number" placeholder="Min" min="0" value={filters.minPrice ?? ''} onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })} style={styles.smallInput} />
              <span>-</span>
              <input type="number" placeholder="Max" min="0" value={filters.maxPrice ?? ''} onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })} style={styles.smallInput} />
            </div>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Age Range</label>
            <div style={styles.rangeInputs}>
              <input type="number" placeholder="Min" min="0" value={filters.minAge ?? ''} onChange={(e) => update({ minAge: e.target.value ? Number(e.target.value) : undefined })} style={styles.smallInput} />
              <span>-</span>
              <input type="number" placeholder="Max" min="0" value={filters.maxAge ?? ''} onChange={(e) => update({ maxAge: e.target.value ? Number(e.target.value) : undefined })} style={styles.smallInput} />
            </div>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date From</label>
            <input type="date" value={filters.dateFrom || ''} onChange={(e) => update({ dateFrom: e.target.value || undefined })} style={styles.dateInput} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date To</label>
            <input type="date" value={filters.dateTo || ''} onChange={(e) => update({ dateTo: e.target.value || undefined })} style={styles.dateInput} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Min Rating</label>
            <select value={filters.minRating ?? ''} onChange={(e) => update({ minRating: e.target.value ? Number(e.target.value) : undefined })} style={styles.selectInput}>
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sort By</label>
            <select value={filters.sortBy || 'date'} onChange={(e) => update({ sortBy: e.target.value })} style={styles.selectInput}>
              <option value="date">Date</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Order</label>
            <select value={filters.sortDir || 'asc'} onChange={(e) => update({ sortDir: e.target.value as 'asc' | 'desc' })} style={styles.selectInput}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { marginBottom: '20px', backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  mainRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  searchInput: { flex: 2, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  subjectInput: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  searchButton: { padding: '10px 24px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  filterToggle: { padding: '10px 16px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  advancedRow: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  filterLabel: { fontSize: '12px', fontWeight: 'bold', color: '#666' },
  rangeInputs: { display: 'flex', alignItems: 'center', gap: '6px' },
  smallInput: { width: '80px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' },
  dateInput: { padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' },
  selectInput: { padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' },
};
