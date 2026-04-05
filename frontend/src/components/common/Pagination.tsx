import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(0, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={styles.container}>
      <button
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ ...styles.button, ...(currentPage === 0 ? styles.disabled : {}) }}
      >
        Prev
      </button>
      {start > 0 && (
        <>
          <button onClick={() => onPageChange(0)} style={styles.button}>1</button>
          {start > 1 && <span style={styles.ellipsis}>...</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          style={{ ...styles.button, ...(p === currentPage ? styles.active : {}) }}
        >
          {p + 1}
        </button>
      ))}
      {end < totalPages - 1 && (
        <>
          {end < totalPages - 2 && <span style={styles.ellipsis}>...</span>}
          <button onClick={() => onPageChange(totalPages - 1)} style={styles.button}>{totalPages}</button>
        </>
      )}
      <button
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ ...styles.button, ...(currentPage >= totalPages - 1 ? styles.disabled : {}) }}
      >
        Next
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '20px' },
  button: { padding: '8px 14px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' },
  active: { backgroundColor: '#0d9488', color: 'white', borderColor: '#0d9488' },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
  ellipsis: { padding: '0 4px', color: '#999' },
};
