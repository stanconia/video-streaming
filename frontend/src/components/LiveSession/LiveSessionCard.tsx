import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveSession } from '../../types/live/liveSession.types';

interface Props {
  session: LiveSession;
  isTeacher?: boolean;
  onStart?: (session: LiveSession) => void;
  onEnd?: (session: LiveSession) => void;
  onCancel?: (session: LiveSession) => void;
  onJoin?: (session: LiveSession) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  LIVE: { bg: '#d4edda', text: '#155724' },
  SCHEDULED: { bg: '#cce5ff', text: '#004085' },
  COMPLETED: { bg: '#e2e3e5', text: '#383d41' },
  CANCELLED: { bg: '#f8d7da', text: '#721c24' },
};

const formatDateTime = (dateStr: string): string => {
  // Treat datetime from backend as local time (not UTC)
  const parts = dateStr.replace('T', '-').replace(/:/g, '-').split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
};

export const LiveSessionCard: React.FC<Props> = ({
  session,
  isTeacher = false,
  onStart,
  onEnd,
  onCancel,
  onJoin,
}) => {
  const navigate = useNavigate();

  const statusColor = STATUS_COLORS[session.status] || STATUS_COLORS.COMPLETED;

  const truncatedDescription =
    session.description && session.description.length > 120
      ? session.description.substring(0, 120) + '...'
      : session.description;

  const renderActions = () => {
    switch (session.status) {
      case 'LIVE':
        if (isTeacher) {
          return (
            <div style={styles.actionRow}>
              {session.roomId && (
                <button
                  onClick={() => navigate(`/room/${session.roomId}/broadcast`)}
                  style={styles.broadcastButton}
                >
                  Go to Broadcast
                </button>
              )}
              {onEnd && (
                <button onClick={() => onEnd(session)} style={styles.endButton}>
                  End Session
                </button>
              )}
            </div>
          );
        }
        // Student view
        if (session.roomId && onJoin) {
          return (
            <div style={styles.actionRow}>
              <button onClick={() => onJoin(session)} style={styles.joinButton}>
                Join Live Session
              </button>
            </div>
          );
        }
        return null;

      case 'SCHEDULED':
        if (isTeacher) {
          const canStart = session.coursePublished;
          return (
            <div>
              {!canStart && (
                <div style={styles.publishWarning}>
                  Course must be published before starting a live session.
                </div>
              )}
              <div style={styles.actionRow}>
                {onStart && (
                  <button
                    onClick={() => onStart(session)}
                    disabled={!canStart}
                    style={canStart ? styles.startButton : styles.startButtonDisabled}
                  >
                    Start Now
                  </button>
                )}
                {onCancel && (
                  <button onClick={() => onCancel(session)} style={styles.cancelActionButton}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        }
        // Student view
        return (
          <div style={styles.scheduledInfo}>
            Starts: {formatDateTime(session.scheduledAt)}
          </div>
        );

      case 'COMPLETED':
        return <div style={styles.statusText}>Completed</div>;

      case 'CANCELLED':
        return <div style={styles.statusText}>Cancelled</div>;

      default:
        return null;
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3
          style={{
            ...styles.title,
            ...(session.status === 'CANCELLED' ? styles.titleCancelled : {}),
          }}
        >
          {session.title}
        </h3>
        <span
          style={{
            ...styles.badge,
            backgroundColor: statusColor.bg,
            color: statusColor.text,
          }}
        >
          {session.status}
        </span>
      </div>

      <div style={styles.cardBody}>
        {truncatedDescription && (
          <p style={styles.description}>{truncatedDescription}</p>
        )}

        <div style={styles.detail}>
          <span style={styles.detailLabel}>Teacher:</span>
          <span>{session.teacherDisplayName}</span>
        </div>

        <div style={styles.detail}>
          <span style={styles.detailLabel}>Scheduled:</span>
          <span>{formatDateTime(session.scheduledAt)}</span>
        </div>

        <div style={styles.detail}>
          <span style={styles.detailLabel}>Duration:</span>
          <span>{formatDuration(session.durationMinutes)}</span>
        </div>
      </div>

      <div style={styles.cardFooter}>{renderActions()}</div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    flex: 1,
    marginRight: '12px',
  },
  titleCancelled: {
    textDecoration: 'line-through',
    color: '#999',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  cardBody: {
    padding: '16px',
  },
  description: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.4',
  },
  detail: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  detailLabel: {
    color: '#666',
    fontWeight: 'bold',
  },
  cardFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #eee',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  joinButton: {
    padding: '10px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
  },
  startButton: {
    padding: '8px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  endButton: {
    padding: '8px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  broadcastButton: {
    padding: '8px 20px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  cancelActionButton: {
    padding: '8px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  scheduledInfo: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#555',
    fontStyle: 'italic',
  },
  statusText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#999',
  },
  publishWarning: {
    padding: '8px 12px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '8px',
    textAlign: 'center',
  },
  startButtonDisabled: {
    padding: '8px 20px',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};
