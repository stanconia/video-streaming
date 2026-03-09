import React, { useState, useEffect } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import { CalendarView } from './CalendarView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarEvent } from '../../types/class/calendar.types';

export const CalendarPage: React.FC = () => {
  const {
    events,
    loading,
    loadEvents,
    getDaysInMonth,
    goToPreviousMonth,
    goToNextMonth,
    monthLabel,
  } = useCalendar();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const days = getDaysInMonth();

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleCloseDayView = () => {
    setSelectedDate(null);
  };

  const getEventsForDate = (date: string): CalendarEvent[] => {
    return events.filter((e) => e.date === date);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Calendar</h1>

      {loading ? (
        <div style={styles.loading}>Loading calendar...</div>
      ) : (
        <CalendarView
          days={days}
          monthLabel={monthLabel}
          onPrevMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onDayClick={handleDayClick}
        />
      )}

      {selectedDate && (
        <CalendarDayView
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          onClose={handleCloseDayView}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
};
