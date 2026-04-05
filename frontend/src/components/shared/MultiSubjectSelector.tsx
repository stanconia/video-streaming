import React, { useState, useMemo } from 'react';
import { SUBJECTS } from '../../data/constants';

interface MultiSubjectSelectorProps {
  selected: string[];
  onChange: (subjects: string[]) => void;
  maxSelections?: number;
}

export const MultiSubjectSelector: React.FC<MultiSubjectSelectorProps> = ({
  selected,
  onChange,
  maxSelections,
}) => {
  const [search, setSearch] = useState('');

  const filteredSubjects = useMemo(() => {
    if (!search) return [...SUBJECTS];
    const lower = search.toLowerCase();
    return SUBJECTS.filter((s) => s.toLowerCase().includes(lower));
  }, [search]);

  const toggleSubject = (subject: string) => {
    if (selected.includes(subject)) {
      onChange(selected.filter((s) => s !== subject));
    } else {
      if (maxSelections && selected.length >= maxSelections) return;
      onChange([...selected, subject]);
    }
  };

  const removeSubject = (subject: string) => {
    onChange(selected.filter((s) => s !== subject));
  };

  return (
    <div style={styles.container}>
      {/* Selected tags */}
      {selected.length > 0 && (
        <div style={styles.selectedTags}>
          {selected.map((s) => (
            <span key={s} style={styles.tag}>
              {s}
              <span
                style={styles.tagRemove}
                onClick={() => removeSubject(s)}
              >
                x
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        style={styles.searchInput}
        placeholder={
          maxSelections
            ? `Search subjects... (${selected.length}/${maxSelections} selected)`
            : `Search subjects... (${selected.length} selected)`
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Subject chips */}
      <div style={styles.chipGrid}>
        {filteredSubjects.map((subject) => {
          const isSelected = selected.includes(subject);
          const isDisabled = !isSelected && !!maxSelections && selected.length >= maxSelections;
          return (
            <button
              key={subject}
              type="button"
              style={{
                ...styles.chip,
                ...(isSelected ? styles.chipSelected : {}),
                ...(isDisabled ? styles.chipDisabled : {}),
              }}
              onClick={() => !isDisabled && toggleSubject(subject)}
              disabled={isDisabled}
            >
              {subject}
            </button>
          );
        })}
        {filteredSubjects.length === 0 && (
          <div style={styles.noResults}>No subjects match your search</div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '12px',
    backgroundColor: '#fafafa',
  },
  selectedTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '10px',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#0d9488',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  tagRemove: {
    cursor: 'pointer',
    marginLeft: '4px',
    fontSize: '12px',
    opacity: 0.8,
  },
  searchInput: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '10px',
    boxSizing: 'border-box' as const,
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  chip: {
    padding: '5px 12px',
    border: '1px solid #ddd',
    borderRadius: '16px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#333',
    transition: 'all 0.15s',
  },
  chipSelected: {
    backgroundColor: '#0d9488',
    color: 'white',
    borderColor: '#0d9488',
  },
  chipDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  noResults: {
    color: '#999',
    fontSize: '13px',
    padding: '8px 0',
  },
};
