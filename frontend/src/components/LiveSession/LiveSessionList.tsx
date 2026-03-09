import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveSession } from '../../types/live/liveSession.types';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';
import { useAuth } from '../../context/AuthContext';
import { LiveSessionCard } from './LiveSessionCard';

interface Props {
  courseId: string;
  moduleId?: string;
  isTeacher?: boolean;
}

const STATUS_ORDER: Record<string, number> = {
  LIVE: 0,
  SCHEDULED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

export const LiveSessionList: React.FC<Props> = ({ courseId, moduleId, isTeacher }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: LiveSession[];
      if (moduleId) {
        data = await liveSessionApi.getSessionsForModule(courseId, moduleId);
      } else {
        data = await liveSessionApi.getSessionsForCourse(courseId);
      }
      // Sort: LIVE first, then SCHEDULED, then COMPLETED/CANCELLED
      data.sort((a, b) => {
        const orderA = STATUS_ORDER[a.status] ?? 99;
        const orderB = STATUS_ORDER[b.status] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        // Within same status group, sort by scheduledAt ascending
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStart = async (session: LiveSession) => {
    try {
      await liveSessionApi.startSession(session.id);
      await loadSessions();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleEnd = async (session: LiveSession) => {
    try {
      await liveSessionApi.endSession(session.id);
      await loadSessions();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to end session');
    }
  };

  const handleCancel = async (session: LiveSession) => {
    try {
      await liveSessionApi.cancelSession(session.id);
      await loadSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel session');
    }
  };

  const handleJoin = (session: LiveSession) => {
    if (session.roomId) {
      navigate(`/room/${session.roomId}/view`);
    }
  };

  const isSessionTeacher = (session: LiveSession): boolean => {
    if (isTeacher !== undefined) return isTeacher;
    return user?.userId === session.teacherUserId;
  };

  if (loading) {
    return <div style={styles.loading}>Loading live sessions...</div>;
  }

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}

      {sessions.length === 0 ? (
        <div style={styles.empty}>No live sessions scheduled</div>
      ) : (
        <div style={styles.grid}>
          {sessions.map((session) => {
            const teacherView = isSessionTeacher(session);
            return (
              <LiveSessionCard
                key={session.id}
                session={session}
                isTeacher={teacherView}
                onStart={teacherView ? handleStart : undefined}
                onEnd={teacherView ? handleEnd : undefined}
                onCancel={teacherView ? handleCancel : undefined}
                onJoin={!teacherView ? handleJoin : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '0',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    fontSize: '14px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    fontSize: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
};
