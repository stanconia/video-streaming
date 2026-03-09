import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoriteTeacher, SavedClass } from '../../types/social/favorites.types';
import { favoriteApi } from '../../services/api/social/FavoriteApi';

type TabType = 'teachers' | 'classes';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  const [teachers, setTeachers] = useState<FavoriteTeacher[]>([]);
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeachers();
    loadClasses();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await favoriteApi.getFavoriteTeachers();
      setTeachers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load favorite teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const data = await favoriteApi.getSavedClasses();
      setSavedClasses(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load saved classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleRemoveTeacher = async (teacherUserId: string) => {
    try {
      await favoriteApi.toggleFavoriteTeacher(teacherUserId);
      setTeachers(teachers.filter((t) => t.teacherUserId !== teacherUserId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove teacher');
    }
  };

  const handleRemoveClass = async (classId: string) => {
    try {
      await favoriteApi.toggleSavedClass(classId);
      setSavedClasses(savedClasses.filter((c) => c.classId !== classId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove class');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const getStatusStyle = (status: string): React.CSSProperties => {
    const colors: Record<string, { bg: string; text: string }> = {
      OPEN: { bg: '#d4edda', text: '#155724' },
      FULL: { bg: '#fff3cd', text: '#856404' },
      IN_PROGRESS: { bg: '#cce5ff', text: '#004085' },
      COMPLETED: { bg: '#e2e3e5', text: '#383d41' },
      CANCELLED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colors[status] || { bg: '#e2e3e5', text: '#383d41' };
    return {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: color.bg,
      color: color.text,
    };
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Favorites</h1>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'teachers' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('teachers')}
        >
          Favorite Teachers
        </button>
        <button
          style={activeTab === 'classes' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('classes')}
        >
          Saved Classes
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {activeTab === 'teachers' && (
        <div style={styles.section}>
          {loadingTeachers ? (
            <div style={styles.loading}>Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div style={styles.empty}>No favorite teachers yet.</div>
          ) : (
            <div style={styles.list}>
              {teachers.map((teacher) => (
                <div key={teacher.id} style={styles.listItem}>
                  <div style={styles.listItemHeader}>
                    <h3
                      style={styles.itemTitle}
                      onClick={() => navigate(`/teachers/${teacher.teacherUserId}`)}
                    >
                      {teacher.teacherDisplayName}
                    </h3>
                    <button
                      onClick={() => handleRemoveTeacher(teacher.teacherUserId)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={styles.itemDetails}>
                    <span>Added: {formatDate(teacher.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'classes' && (
        <div style={styles.section}>
          {loadingClasses ? (
            <div style={styles.loading}>Loading classes...</div>
          ) : savedClasses.length === 0 ? (
            <div style={styles.empty}>No saved classes yet.</div>
          ) : (
            <div style={styles.list}>
              {savedClasses.map((cls) => (
                <div key={cls.id} style={styles.listItem}>
                  <div style={styles.listItemHeader}>
                    <h3
                      style={styles.itemTitle}
                      onClick={() => navigate(`/classes/${cls.classId}`)}
                    >
                      {cls.classTitle}
                    </h3>
                    <div style={styles.headerRight}>
                      <span style={getStatusStyle(cls.classStatus)}>{cls.classStatus}</span>
                      <button
                        onClick={() => handleRemoveClass(cls.classId)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={styles.itemDetails}>
                    <span>Scheduled: {formatDate(cls.scheduledAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  tabs: { display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #eee' },
  tab: { padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: '15px', color: '#666', fontWeight: 'bold', marginBottom: '-2px' },
  activeTab: { padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid #007bff', cursor: 'pointer', fontSize: '15px', color: '#007bff', fontWeight: 'bold', marginBottom: '-2px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  empty: { textAlign: 'center', padding: '40px', color: '#666' },
  section: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { border: '1px solid #eee', borderRadius: '8px', padding: '16px' },
  listItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  itemTitle: { margin: 0, fontSize: '16px', cursor: 'pointer', color: '#007bff' },
  itemDetails: { display: 'flex', gap: '20px', fontSize: '14px', color: '#666' },
  removeButton: { padding: '6px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};
