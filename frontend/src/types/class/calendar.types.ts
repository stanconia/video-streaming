export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  type: 'teaching' | 'enrolled' | 'available';
  status: string;
  classId: string;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
}
