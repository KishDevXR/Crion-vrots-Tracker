import { format, parseISO, startOfWeek, getWeek } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return dateString;
  }
};

export const getWeekStartDateString = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  return format(start, 'yyyy-MM-dd');
};

export const getWeekNumber = (date = new Date()) => {
  return getWeek(date, { weekStartsOn: 1 });
};

export const getDaysInSprint = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return [];
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  const days = [];
  let current = new Date(start);
  while (current <= end) {
    days.push(format(current, 'yyyy-MM-dd'));
    current.setDate(current.getDate() + 1);
  }
  return days;
};
