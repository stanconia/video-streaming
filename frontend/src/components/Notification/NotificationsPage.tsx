import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationPage, parseNotificationData } from '../../types/social/notification.types';
import { notificationApi } from '../../services/api/social/NotificationApi';
import { Pagination } from '../common/Pagination';

const typeColorMap: Record<string, string> = {
  WELCOME: '#28a745',
  COURSE_ENROLLED: '#007bff',
  COURSE_COMPLETED: '#6f42c1',
  MESSAGE_RECEIVED: '#17a2b8',
  REVIEW_RECEIVED: '#fd7e14',
  REVIEW_REPLY: '#fd7e14',
  CERTIFICATE_ISSUED: '#28a745',
  ASSIGNMENT_GRADED: '#dc3545',
  ASSIGNMENT_SUBMITTED: '#ffc107',
  DISCUSSION_REPLY: '#17a2b8',
  QUIZ_RESULT: '#6f42c1',
  SYSTEM: '#6c757d',
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications(page);
  }, [page]);

  const loadNotifications = async (p: number) => {
    try {
      setLoading(true);
      const data: NotificationPage = await notificationApi.getNotifications(p, 20);
      setNotifications(data.content);
      setTotalPages(data.totalPages);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (n: Notification) => {
    handleMarkAsRead(n.id);
    const data = parseNotificationData(n.data);
    if (data?.link) {
      navigate(data.link);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Notifications</h1>
        <button onClick={handleMarkAllAsRead} style={styles.markAllButton}>Mark all as read</button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>No notifications yet.</div>
      ) : (
        <>
          <div style={styles.list}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  ...styles.card,
                  ...(n.read ? {} : styles.unread),
                  borderLeft: `4px solid ${typeColorMap[n.type] || '#6c757d'}`,
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.title}>{n.title}</span>
                  <div style={styles.actions}>
                    {parseNotificationData(n.data)?.link && (
                      <button onClick={() => handleClick(n)} style={styles.viewButton}>View</button>
                    )}
                    {!n.read && (
                      <button onClick={() => handleMarkAsRead(n.id)} style={styles.readButton}>Mark read</button>
                    )}
                  </div>
                </div>
                <p style={styles.message}>{n.message}</p>
                <span style={styles.time}>{formatDate(n.createdAt)}</span>
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
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  markAllButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  empty: { textAlign: 'center', padding: '60px', color: '#666', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  unread: { backgroundColor: '#f0f7ff' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  title: { fontWeight: 'bold', fontSize: '15px' },
  actions: { display: 'flex', gap: '8px' },
  readButton: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '12px' },
  viewButton: { padding: '4px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  message: { color: '#555', fontSize: '14px', lineHeight: '1.5', margin: '0 0 8px 0' },
  time: { fontSize: '12px', color: '#999' },
};
