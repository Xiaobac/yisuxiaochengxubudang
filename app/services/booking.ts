import { get, put, del } from '@/app/lib/request';
import type { Booking, BookingStatus } from '@/app/types';

/**
 * 获取当前商户的酒店预订列表
 */
export const getMyBookings = async () => {
  // 先获取商户的酒店列表
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!userStr) {
    throw new Error('用户未登录');
  }

  const user = JSON.parse(userStr);

  // 获取商户的酒店ID
  const hotelsResponse = await get<{ success: boolean; data: any[] }>(`/hotels?merchantId=${user.id}`);
  const hotels = hotelsResponse.data;

  if (!hotels || hotels.length === 0) {
    return [];
  }

  // 获取所有酒店的预订记录
  const allBookings: any[] = [];
  for (const hotel of hotels) {
    const bookingsResponse = await get<{ success: boolean; data: any[] }>(`/hotels/${hotel.id}/bookings`);
    if (bookingsResponse.success && bookingsResponse.data) {
      allBookings.push(...bookingsResponse.data);
    }
  }

  // 转换数据格式为前端格式
  return allBookings.map((booking: any) => ({
    id: booking.id,
    hotel_id: booking.hotelId,
    hotel_name: booking.hotel?.nameZh || '-',
    room_type: booking.roomType?.name || '-',
    customer_name: booking.user?.name || '-',
    customer_phone: booking.user?.phone || '-',
    customer_email: booking.user?.email || '-',
    check_in_date: booking.checkInDate,
    check_out_date: booking.checkOutDate,
    room_count: booking.guestCount || 1,
    total_price: Number(booking.totalPrice),
    status: booking.status as BookingStatus,
    special_requests: booking.guestInfo?.specialRequests || '',
    created_at: booking.createdAt,
  })) as Booking[];
};

/**
 * 更新预订状态（商户操作）
 */
export const updateBookingStatus = async (id: number, status: BookingStatus) => {
  const response = await put<{ success: boolean; data: any }>(`/bookings/${id}`, { status });
  return response.data;
};

/**
 * 取消预订
 */
export const cancelBooking = async (id: number) => {
  const response = await put<{ success: boolean; message: string }>(`/bookings/${id}`, {
    status: 'cancelled'
  });
  return response;
};

/**
 * 删除预订
 */
export const deleteBooking = async (id: number) => {
  const response = await del<{ success: boolean; message: string }>(`/bookings/${id}`);
  return response;
};
