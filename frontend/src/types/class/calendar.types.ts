export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  type: 'teaching' | 'enrolled' | 'live_session' | 'available';
  status: string;
  classId: string | null;
  moduleTitle?: string | null;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
}
