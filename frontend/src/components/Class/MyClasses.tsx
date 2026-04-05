import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScheduledClass, Booking } from '../../types/class/class.types';
import { classApi } from '../../services/api/class/ClassApi';
import { bookingApi } from '../../services/api/class/BookingApi';
import { useAuth } from '../../context/AuthContext';
import { AttendanceView } from './AttendanceView';

export const MyClasses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacherClasses, setTeacherClasses] = useState<ScheduledClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'TEACHER') {
        const data = await classApi.getMyClasses();
        setTeacherClasses(data);
      }
      const bookingData = await bookingApi.getMyBookings();
      setBookings(bookingData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingApi.cancelBooking(bookingId);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
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
      CONFIRMED: { bg: '#d4edda', text: '#155724' },
    };
    const color = colors[status] || { bg: '#e2e3e5', text: '#383d41' };
    return { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: color.bg, color: color.text };
  };

  return (
    <div style={styles.container}>
      <h1>My Classes</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>{user?.role === 'TEACHER' ? 'Manage your classes and bookings' : 'Your booked classes'}</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          {user?.role === 'TEACHER' && (
            <div style={styles.section}>
              <h2>My Created Classes</h2>
              {teacherClasses.length === 0 ? (
                <p style={styles.empty}>No classes created yet.</p>
              ) : (
                <div style={styles.list}>
                  {teacherClasses.map((cls) => (
                    <div key={cls.id} style={styles.listItem}>
                      <div style={styles.listItemHeader}>
                        <h3 style={styles.itemTitle} onClick={() => navigate(`/classes/${cls.id}`)}>
                          {cls.title}
                        </h3>
                        <span style={getStatusStyle(cls.status)}>{cls.status}</span>
                      </div>
                      <div style={styles.itemDetails}>
                        <span>{formatDate(cls.scheduledAt)}</span>
                        <span>{cls.enrolledStudents}/{cls.maxStudents} students</span>
                        <span>{cls.price > 0 ? `$${(cls.price / 100).toFixed(2)}` : 'Free'}</span>
                      </div>
                      <div style={styles.itemActions}>
                        {(cls.status === 'OPEN' || cls.status === 'FULL') && (
                          <button onClick={() => navigate(`/classes/${cls.id}`)} style={styles.manageButton}>
                            Manage
                          </button>
                        )}
                        {cls.status === 'IN_PROGRESS' && cls.roomId && (
                          <button onClick={() => navigate(`/room/${cls.roomId}/broadcast`)} style={styles.joinButton}>
                            Join Room
                          </button>
                        )}
                      </div>
                      {cls.status === 'COMPLETED' && (
                        <AttendanceView classId={cls.id} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={styles.section}>
            <h2>My Bookings</h2>
            {bookings.length === 0 ? (
              <p style={styles.empty}>No bookings yet.</p>
            ) : (
              <div style={styles.list}>
                {bookings.map((booking) => (
                  <div key={booking.id} style={styles.listItem}>
                    <div style={styles.listItemHeader}>
                      <h3 style={styles.itemTitle} onClick={() => navigate(`/classes/${booking.classId}`)}>
                        {booking.classTitle}
                      </h3>
                      <span style={getStatusStyle(booking.status)}>{booking.status}</span>
                    </div>
                    <div style={styles.itemDetails}>
                      <span>Booked: {formatDate(booking.createdAt)}</span>
                      <span>{booking.paidAmount > 0 ? `Paid: $${(booking.paidAmount / 100).toFixed(2)}` : 'Free'}</span>
                    </div>
                    <div style={styles.itemActions}>
                      {booking.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => navigate(`/classes/${booking.classId}`)} style={styles.viewButton}>
                            View Class
                          </button>
                          <button onClick={() => handleCancelBooking(booking.id)} style={styles.cancelBookingButton}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  header: { marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '14px', color: '#555' },
  backButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  logoutButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  section: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
  empty: { color: '#666', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { border: '1px solid #eee', borderRadius: '8px', padding: '16px' },
  listItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  itemTitle: { margin: 0, fontSize: '16px', cursor: 'pointer', color: '#0d9488' },
  itemDetails: { display: 'flex', gap: '20px', fontSize: '14px', color: '#666', marginBottom: '12px' },
  itemActions: { display: 'flex', gap: '8px' },
  manageButton: { padding: '6px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  joinButton: { padding: '6px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  viewButton: { padding: '6px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  cancelBookingButton: { padding: '6px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};
