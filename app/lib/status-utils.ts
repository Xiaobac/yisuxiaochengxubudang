import type { BookingStatus } from '@/app/types';

const STATUS_COLOR_MAP: Record<BookingStatus, string> = {
  pending: 'orange',
  confirmed: 'blue',
  checked_in: 'green',
  checked_out: 'default',
  completed: 'gray',
  cancelled: 'red',
};

const STATUS_TEXT_MAP: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  checked_in: '已入住',
  checked_out: '已退房',
  completed: '已完成',
  cancelled: '已取消',
};

export const getStatusColor = (status: BookingStatus): string =>
  STATUS_COLOR_MAP[status] || 'default';

export const getStatusText = (status: BookingStatus): string =>
  STATUS_TEXT_MAP[status] || status;
