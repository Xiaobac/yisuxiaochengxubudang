import { get, post } from './request';

// 获取所有优惠券列表（领券页展示）
export const getCoupons = async () => {
  const res = await get('/coupons');
  return res;
};

// 获取当前用户已领取的优惠券列表
export const getUserCoupons = async () => {
  const res = await get('/user/coupons');
  return res;
};

// 领取优惠券
export const claimCoupon = async (couponId) => {
  const res = await post(`/coupons/${couponId}/claim`, {});
  return res;
};
