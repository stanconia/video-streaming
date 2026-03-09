import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, parseNotificationData } from '../../types/social/notification.types';

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

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

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const navigate = useNavigate();

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleClick = (n: Notification) => {
    onMarkAsRead(n.id);
    const data = parseNotificationData(n.data);
    if (data?.link) {
      onClose();
      navigate(data.link);
    }
  };

  return (
    <div style={styles.dropdown}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Notifications</span>
        <button onClick={onMarkAllAsRead} style={styles.markAllButton}>Mark all read</button>
      </div>
      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>No notifications</div>
      ) : (
        <div style={styles.list}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                ...styles.item,
                ...(n.read ? {} : styles.unread),
                borderLeft: `4px solid ${typeColorMap[n.type] || '#6c757d'}`,
              }}
              onClick={() => handleClick(n)}
            >
              <div style={styles.itemTitle}>{n.title}</div>
              <div style={styles.itemMessage}>{n.message}</div>
              <div style={styles.itemTime}>{formatTime(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={styles.footer}>
        <button onClick={() => { onClose(); navigate('/notifications'); }} style={styles.viewAllButton}>
          View All
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  dropdown: { position: 'absolute', top: '100%', right: 0, width: '340px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', marginTop: '8px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee' },
  headerTitle: { fontWeight: 'bold', fontSize: '14px' },
  markAllButton: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '12px' },
  loading: { padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px' },
  empty: { padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px' },
  list: { maxHeight: '320px', overflowY: 'auto' },
  item: { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' },
  unread: { backgroundColor: '#f0f7ff' },
  itemTitle: { fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' },
  itemMessage: { fontSize: '12px', color: '#555', marginBottom: '4px', lineHeight: '1.4' },
  itemTime: { fontSize: '11px', color: '#999' },
  footer: { padding: '8px 16px', borderTop: '1px solid #eee', textAlign: 'center' },
  viewAllButton: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
};
