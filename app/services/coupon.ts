import { get, post, put, del } from '@/app/lib/request';
import type { ApiResponse, Coupon } from '@/app/types';

export type CouponPayload = Omit<Coupon, 'id'>

export const getCoupons = () => {
    return get<ApiResponse<Coupon[]>>('/coupons');
};

export const createCoupon = (data: CouponPayload) => {
    return post<ApiResponse<Coupon>>('/coupons', data);
};

export const updateCoupon = (id: number, data: Partial<CouponPayload>) => {
    return put<ApiResponse<Coupon>>(`/coupons/${id}`, data);
};

export const deleteCoupon = (id: number) => {
    return del<ApiResponse>(`/coupons/${id}`);
};
