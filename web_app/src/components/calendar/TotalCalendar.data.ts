import leaveService from '../../services/leaveService';

export const fetchMonthlyCalendar = (userId: string, month: string) =>
  leaveService.getMonthlyCalendar({ userId, month });

export const fetchTotalCalendar = (month: string) =>
  leaveService.getTotalCalendar(month);

export const fetchHolidays = (year: number, month: number) =>
  leaveService.getHolidays(year, month);
