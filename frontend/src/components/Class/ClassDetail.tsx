import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScheduledClass } from '../../types/class/class.types';
import { classApi } from '../../services/api/class/ClassApi';
import { bookingApi } from '../../services/api/class/BookingApi';
import { useAuth } from '../../context/AuthContext';
import { CheckoutForm } from '../Payment/CheckoutForm';
import { AttendanceView } from './AttendanceView';
import { favoriteApi } from '../../services/api/social/FavoriteApi';
import { MaterialsList } from '../Materials/MaterialsList';
import { MaterialUpload } from '../Materials/MaterialUpload';

export const ClassDetail: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [scheduledClass, setScheduledClass] = useState<ScheduledClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [materialsKey, setMaterialsKey] = useState(0);

  useEffect(() => {
    if (classId) loadClass();
  }, [classId]);

  const loadClass = async () => {
    try {
      setLoading(true);
      const data = await classApi.getClass(classId!);
      setScheduledClass(data);
      try {
        const saved = await favoriteApi.isSavedClass(classId!);
        setIsSaved(saved);
      } catch {}
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load class');
    } finally {
      setLoading(false);
    }
  };

  const handleBookFree = async () => {
    try {
      setBookingLoading(true);
      setError(null);
      await bookingApi.bookClass(classId!);
      navigate('/my-classes');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to book class');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setBookingLoading(true);
      await bookingApi.bookClass(classId!, paymentIntentId);
      navigate('/my-classes');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStartClass = async () => {
    try {
      setError(null);
      const updated = await classApi.startClass(classId!);
      if (updated.roomId) {
        navigate(`/room/${updated.roomId}/broadcast`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start class');
    }
  };

  const handleCancelClass = async () => {
    try {
      setError(null);
      await classApi.cancelClass(classId!);
      loadClass();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel class');
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      setWaitlistLoading(true);
      setError(null);
      await classApi.joinWaitlist(classId!);
      loadClass();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  if (loading) return <div style={styles.loading}>Loading class...</div>;
  if (!scheduledClass) return <div style={styles.error}>Class not found</div>;

  const isTeacherOwner = user?.userId === scheduledClass.teacherUserId;
  const isStudent = user?.role === 'STUDENT';
  const canBook = isStudent && (scheduledClass.status === 'OPEN');
  const canWaitlist = isStudent && scheduledClass.status === 'FULL';
  const canJoin = scheduledClass.status === 'IN_PROGRESS' && scheduledClass.roomId;
  const isCompleted = scheduledClass.status === 'COMPLETED';

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/classes')} style={styles.backButton}>Back to Classes</button>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={styles.title}>{scheduledClass.title}</h1>
            <span style={styles.statusBadge}>{scheduledClass.status}</span>
          </div>
          <button
            onClick={async () => {
              try {
                const result = await favoriteApi.toggleSavedClass(classId!);
                setIsSaved(result.saved);
              } catch {}
            }}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: isSaved ? '#fd7e14' : '#ccc' }}
            title={isSaved ? 'Remove from saved' : 'Save class'}
          >
            {isSaved ? '\u2605' : '\u2606'}
          </button>
        </div>

        {scheduledClass.description && (
          <p style={styles.description}>{scheduledClass.description}</p>
        )}

        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.label}>Teacher:</span>
            <span
              style={styles.teacherLink}
              onClick={() => navigate(`/teachers/${scheduledClass.teacherUserId}`)}
            >
              {scheduledClass.teacherDisplayName}
            </span>
          </div>
          {scheduledClass.subject && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Subject:</span>
              <span>{scheduledClass.subject}</span>
            </div>
          )}
          <div style={styles.detailRow}>
            <span style={styles.label}>When:</span>
            <span>{formatDate(scheduledClass.scheduledAt)}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Duration:</span>
            <span>{scheduledClass.durationMinutes} minutes</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Spots:</span>
            <span>{scheduledClass.enrolledStudents} / {scheduledClass.maxStudents}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Price:</span>
            <span style={styles.price}>
              {scheduledClass.price > 0 ? `$${(scheduledClass.price / 100).toFixed(2)}` : 'Free'}
            </span>
          </div>
          {scheduledClass.ageMin != null && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Age Range:</span>
              <span>{scheduledClass.ageMin}{scheduledClass.ageMax != null ? ` - ${scheduledClass.ageMax}` : '+'}</span>
            </div>
          )}
          {scheduledClass.teacherAverageRating != null && scheduledClass.teacherAverageRating > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Teacher Rating:</span>
              <span>{scheduledClass.teacherAverageRating.toFixed(1)}</span>
            </div>
          )}
          {scheduledClass.waitlistCount > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Waitlist:</span>
              <span>{scheduledClass.waitlistCount} waiting</span>
            </div>
          )}
        </div>

        {scheduledClass.tags && (
          <div style={styles.tags}>
            {scheduledClass.tags.split(',').map((t, i) => (
              <span key={i} style={styles.tag}>{t.trim()}</span>
            ))}
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          {isTeacherOwner && (scheduledClass.status === 'OPEN' || scheduledClass.status === 'FULL') && (
            <>
              <button onClick={handleStartClass} style={styles.startButton}>Start Class</button>
              <button onClick={handleCancelClass} style={styles.cancelButton}>Cancel Class</button>
            </>
          )}

          {canBook && !showCheckout && (
            scheduledClass.price > 0 ? (
              <button onClick={() => setShowCheckout(true)} style={styles.bookButton}>
                Book Now - ${(scheduledClass.price / 100).toFixed(2)}
              </button>
            ) : (
              <button onClick={handleBookFree} disabled={bookingLoading} style={styles.bookButton}>
                {bookingLoading ? 'Booking...' : 'Book Free Class'}
              </button>
            )
          )}

          {canWaitlist && (
            <button onClick={handleJoinWaitlist} disabled={waitlistLoading} style={styles.waitlistButton}>
              {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
            </button>
          )}

          {canJoin && (
            <button
              onClick={() => navigate(`/room/${scheduledClass.roomId}/${isTeacherOwner ? 'broadcast' : 'view'}`)}
              style={styles.joinButton}
            >
              Join Class
            </button>
          )}
        </div>

        {showCheckout && scheduledClass.price > 0 && (
          <CheckoutForm
            classId={classId!}
            amount={scheduledClass.price}
            currency={scheduledClass.currency}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        )}

        <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3>Class Materials</h3>
          {isTeacherOwner && (
            <MaterialUpload classId={classId!} onUploaded={() => setMaterialsKey(k => k + 1)} />
          )}
          <MaterialsList key={materialsKey} classId={classId!} isTeacher={isTeacherOwner} />
        </div>

        {isCompleted && isTeacherOwner && (
          <AttendanceView classId={classId!} />
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  backButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 8px 0' },
  statusBadge: { display: 'inline-block', padding: '4px 12px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' },
  description: { color: '#555', lineHeight: '1.6', marginBottom: '20px' },
  details: { borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '20px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' },
  label: { fontWeight: 'bold', color: '#666' },
  teacherLink: { color: '#007bff', cursor: 'pointer', textDecoration: 'underline' },
  price: { fontWeight: 'bold', color: '#28a745', fontSize: '16px' },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '16px' },
  tag: { padding: '4px 10px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '12px', color: '#495057' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  bookButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  startButton: { padding: '12px 32px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  cancelButton: { padding: '12px 32px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  joinButton: { padding: '12px 32px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  waitlistButton: { padding: '12px 32px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
};
