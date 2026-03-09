import React, { useState, useEffect } from 'react';
import { AdminUser, AdminUserPage } from '../../types/admin/admin.types';
import { adminApi } from '../../services/api/admin/AdminApi';
import { Pagination } from '../common/Pagination';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const loadUsers = async (p: number) => {
    try {
      setLoading(true);
      const data: AdminUserPage = await adminApi.getUsers(p, 20);
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await adminApi.changeUserRole(userId, role);
      loadUsers(page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change role');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div style={styles.container} className="page-container">
      <h1 style={styles.pageTitle}>User Management</h1>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading users...</div>
      ) : (
        <>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.col}>Name</span>
              <span style={styles.col}>Email</span>
              <span style={styles.colSmall}>Role</span>
              <span style={styles.colSmall}>Joined</span>
              <span style={styles.colSmall}>Actions</span>
            </div>
            {users.map((u) => (
              <div key={u.id} style={styles.tableRow}>
                <span style={styles.col}>{u.displayName}</span>
                <span style={styles.col}>{u.email}</span>
                <span style={styles.colSmall}>
                  <span style={styles.roleBadge}>{u.role}</span>
                </span>
                <span style={styles.colSmall}>{formatDate(u.createdAt)}</span>
                <span style={styles.colSmall}>
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    style={styles.select}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </span>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1100px', margin: '0 auto' },
  pageTitle: { marginBottom: '24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  table: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '13px', borderBottom: '2px solid #eee' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', alignItems: 'center', fontSize: '14px' },
  col: { flex: 2, overflow: 'hidden', textOverflow: 'ellipsis' },
  colSmall: { flex: 1 },
  roleBadge: { padding: '2px 8px', backgroundColor: '#e9ecef', borderRadius: '10px', fontSize: '12px' },
  select: { padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' },
};
