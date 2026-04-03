import React, { useState, useMemo } from 'react';
import { SUBJECTS } from '../../data/constants';

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select a subject...',
}) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSubjects = useMemo(() => {
    if (!search) return [...SUBJECTS];
    const lower = search.toLowerCase();
    return SUBJECTS.filter((s) => s.toLowerCase().includes(lower));
  }, [search]);

  const handleSelect = (subject: string) => {
    onChange(subject);
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        style={styles.input}
        placeholder={placeholder}
        value={showDropdown ? search : value}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!showDropdown) setShowDropdown(true);
        }}
        onFocus={() => {
          setShowDropdown(true);
          setSearch('');
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
      />
      {value && !showDropdown && (
        <button
          type="button"
          style={styles.clearBtn}
          onClick={() => {
            onChange('');
            setSearch('');
          }}
        >
          x
        </button>
      )}
      {showDropdown && (
        <div style={styles.dropdown}>
          {filteredSubjects.length === 0 ? (
            <div style={styles.noResults}>No subjects found</div>
          ) : (
            filteredSubjects.map((s) => (
              <div
                key={s}
                style={{
                  ...styles.dropdownItem,
                  backgroundColor: s === value ? '#e9ecef' : undefined,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
              >
                {s}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  clearBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#999',
    padding: '2px 6px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    zIndex: 100,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  dropdownItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  noResults: {
    padding: '8px 12px',
    color: '#999',
    fontSize: '13px',
  },
};
