import React from 'react';
import { CalendarDay } from '../../types/class/calendar.types';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarViewProps {
  days: CalendarDay[];
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  days,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}) => {
  const getDayNumber = (dateStr: string): number => {
    return new Date(dateStr + 'T12:00:00').getDate();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onPrevMonth} style={styles.navButton}>&lt;</button>
        <h2 style={styles.monthLabel}>{monthLabel}</h2>
        <button onClick={onNextMonth} style={styles.navButton}>&gt;</button>
      </div>

      <div style={styles.dayHeaders}>
        {DAY_HEADERS.map((d) => (
          <div key={d} style={styles.dayHeader}>{d}</div>
        ))}
      </div>

      <div style={styles.grid}>
        {days.map((day, index) => {
          const cellStyle: React.CSSProperties = {
            ...styles.cell,
            ...(day.isCurrentMonth ? {} : styles.dimmedCell),
            ...(day.isToday ? styles.todayCell : {}),
          };

          return (
            <div
              key={index}
              style={cellStyle}
              onClick={() => onDayClick(day.date)}
            >
              <span style={day.isToday ? styles.todayNumber : styles.dayNumber}>
                {getDayNumber(day.date)}
              </span>
              {day.events.length > 0 && (
                <div style={styles.eventsContainer}>
                  {day.events.slice(0, 2).map((evt, i) => {
                    const color = evt.type === 'teaching' ? '#007bff' : evt.type === 'live_session' ? '#fd7e14' : '#28a745';
                    const label = evt.type === 'live_session' && evt.moduleTitle
                      ? evt.moduleTitle
                      : evt.title;
                    return (
                      <div key={i} style={{ ...styles.eventChip, backgroundColor: color }}>
                        <span style={styles.eventChipText}>
                          {evt.time ? `${evt.time} ` : ''}{label}
                        </span>
                      </div>
                    );
                  })}
                  {day.events.length > 2 && (
                    <span style={styles.moreText}>+{day.events.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: '#007bff' }} />
          <span style={styles.legendText}>Teaching</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: '#fd7e14' }} />
          <span style={styles.legendText}>Live Session</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: '#28a745' }} />
          <span style={styles.legendText}>Enrolled</span>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  navButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  monthLabel: { margin: 0, fontSize: '20px', color: '#333' },
  dayHeaders: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '4px' },
  dayHeader: { textAlign: 'center', padding: '8px 0', fontWeight: 'bold', fontSize: '13px', color: '#666' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#eee' },
  cell: { backgroundColor: 'white', minHeight: '80px', padding: '6px', cursor: 'pointer', position: 'relative' },
  dimmedCell: { backgroundColor: '#f9f9f9', opacity: 0.5 },
  todayCell: { backgroundColor: '#e8f4fd' },
  dayNumber: { fontSize: '13px', color: '#333' },
  todayNumber: { fontSize: '13px', color: '#007bff', fontWeight: 'bold' },
  eventsContainer: { display: 'flex', flexDirection: 'column' as const, gap: '2px', marginTop: '2px' },
  eventChip: { borderRadius: '3px', padding: '1px 4px', overflow: 'hidden' as const },
  eventChipText: { fontSize: '10px', color: 'white', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, display: 'block' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  moreText: { fontSize: '10px', color: '#666', marginTop: '1px' },
  legend: { display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  legendText: { fontSize: '13px', color: '#666' },
};
