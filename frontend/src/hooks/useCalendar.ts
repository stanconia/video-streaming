import { useState, useCallback } from 'react';
import { CalendarEvent, CalendarDay } from '../types/class/calendar.types';
import { bookingApi } from '../services/api/class/BookingApi';
import { classApi } from '../services/api/class/ClassApi';
import { useAuth } from '../context/AuthContext';

export function useCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const allEvents: CalendarEvent[] = [];

      // Load user's bookings
      try {
        const bookings = await bookingApi.getMyBookings();
        bookings.forEach((b) => {
          if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
            allEvents.push({
              id: b.id,
              title: b.classTitle,
              date: b.createdAt.split('T')[0],
              time: '',
              durationMinutes: 0,
              type: 'enrolled',
              status: b.status,
              classId: b.classId,
            });
          }
        });
      } catch (e) {
        /* ignore */
      }

      // Load teacher's classes if teacher
      if (user.role === 'TEACHER') {
        try {
          const teacherClasses = await classApi.getMyClasses();
          teacherClasses.forEach((cls) => {
            const dateStr = cls.scheduledAt.split('T')[0];
            const timeStr = cls.scheduledAt.includes('T')
              ? cls.scheduledAt.split('T')[1]?.substring(0, 5) || ''
              : '';
            allEvents.push({
              id: cls.id,
              title: cls.title,
              date: dateStr,
              time: timeStr,
              durationMinutes: cls.durationMinutes,
              type: 'teaching',
              status: cls.status,
              classId: cls.id,
            });
          });
        } catch (e) {
          /* ignore */
        }
      }

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getDaysInMonth = useCallback((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    const days: CalendarDay[] = [];

    // Days from previous month to fill the first week
    const startPad = firstDay.getDay(); // 0=Sun
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d.toISOString().split('T')[0],
        events: events.filter((e) => e.date === d.toISOString().split('T')[0]),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        events: events.filter((e) => e.date === dateStr),
        isCurrentMonth: true,
        isToday: d.toDateString() === today.toDateString(),
      });
    }

    // Fill remaining days to complete the grid (always 42 cells = 6 rows)
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - startPad - lastDay.getDate() + 1);
      days.push({
        date: d.toISOString().split('T')[0],
        events: events.filter((e) => e.date === d.toISOString().split('T')[0]),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate, events]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return {
    currentDate,
    events,
    loading,
    loadEvents,
    getDaysInMonth,
    goToPreviousMonth,
    goToNextMonth,
    monthLabel,
  };
}
