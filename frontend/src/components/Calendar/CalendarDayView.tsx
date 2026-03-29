import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../../types/class/calendar.types';

interface CalendarDayViewProps {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({ date, events, onClose }) => {
  const navigate = useNavigate();

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeBadgeStyle = (type: string): React.CSSProperties => {
    if (type === 'teaching') {
      return { ...styles.typeBadge, backgroundColor: '#cce5ff', color: '#004085' };
    }
    if (type === 'live_session') {
      return { ...styles.typeBadge, backgroundColor: '#ffe5cc', color: '#7c3a00' };
    }
    if (type === 'enrolled') {
      return { ...styles.typeBadge, backgroundColor: '#d4edda', color: '#155724' };
    }
    return { ...styles.typeBadge, backgroundColor: '#e9ecef', color: '#495057' };
  };

  const getTypeLabel = (type: string): string => {
    if (type === 'teaching') return 'Teaching';
    if (type === 'live_session') return 'Live Session';
    if (type === 'enrolled') return 'Enrolled';
    return 'Available';
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.dateTitle}>{formatDisplayDate(date)}</h3>
          <button onClick={onClose} style={styles.closeButton}>X</button>
        </div>

        <div style={styles.modalBody}>
          {events.length === 0 ? (
            <div style={styles.empty}>No events on this day.</div>
          ) : (
            <div style={styles.eventList}>
              {events.map((event) => (
                <div
                  key={event.id}
                  style={styles.eventItem}
                  onClick={() => {
                    if (event.classId) {
                      navigate(`/classes/${event.classId}`);
                    }
                  }}
                >
                  <div style={styles.eventHeader}>
                    <span style={styles.eventTitle}>{event.title}</span>
                    <span style={getTypeBadgeStyle(event.type)}>
                      {getTypeLabel(event.type)}
                    </span>
                  </div>
                  <div style={styles.eventDetails}>
                    {event.time && <span>Time: {event.time}</span>}
                    {event.durationMinutes > 0 && <span>{event.durationMinutes} min</span>}
                    {event.moduleTitle && <span>Module: {event.moduleTitle}</span>}
                    <span>Status: {event.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eee' },
  dateTitle: { margin: 0, fontSize: '16px' },
  closeButton: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#666' },
  modalBody: { padding: '20px' },
  empty: { textAlign: 'center', padding: '20px', color: '#666' },
  eventList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  eventItem: { border: '1px solid #eee', borderRadius: '6px', padding: '12px', cursor: 'pointer' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  eventTitle: { fontSize: '14px', fontWeight: 'bold', color: '#007bff' },
  typeBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' },
  eventDetails: { display: 'flex', gap: '16px', fontSize: '13px', color: '#666' },
};
