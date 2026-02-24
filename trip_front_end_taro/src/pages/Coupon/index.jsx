import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getCoupons, getUserCoupons, claimCoupon } from '../../services/coupon';
import { storage } from '../../utils/storage';
import dayjs from 'dayjs';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import { useTheme } from '../../utils/useTheme';
import './index.css';

function Coupons() {
  const { cssVars } = useTheme();
  const [couponList, setCouponList] = useState([]);
  const [claimedIds, setClaimedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 并行请求优惠券列表和已领取列表
      const [allRes, claimedRes] = await Promise.allSettled([
        getCoupons(),
        getUserCoupons(),
      ]);

      // 处理优惠券列表
      let allData = [];
      if (allRes.status === 'fulfilled' && allRes.value) {
        const res = allRes.value;
        if (Array.isArray(res)) allData = res;
        else if (res.data && Array.isArray(res.data)) allData = res.data;
      }
      setCouponList(allData);

      // 处理已领取 ID 集合
      let claimed = new Set();
      if (claimedRes.status === 'fulfilled' && claimedRes.value) {
        const res = claimedRes.value;
        let claimedData = [];
        if (Array.isArray(res)) claimedData = res;
        else if (res.data && Array.isArray(res.data)) claimedData = res.data;
        claimed = new Set(claimedData.map(uc => uc.couponId));
      }
      setClaimedIds(claimed);
    } catch (error) {
      console.error('加载优惠券数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (couponId) => {
    if (!storage.isAuthenticated()) {
      Taro.showToast({ title: '请先登录后领取', icon: 'none', duration: 1500 });
      return;
    }
    if (claimingId) return;
    setClaimingId(couponId);
    try {
      const res = await claimCoupon(couponId);
      if (res && (res.success !== false)) {
        setClaimedIds(prev => new Set([...prev, couponId]));
        Taro.showToast({ title: '领取成功', icon: 'success', duration: 1500 });
      } else {
        Taro.showToast({ title: res?.message || '领取失败', icon: 'none', duration: 2000 });
      }
    } catch (error) {
      // 未登录时跳转登录
      if (error?.statusCode === 401) {
        Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      } else {
        Taro.showToast({ title: '领取失败，请重试', icon: 'none', duration: 2000 });
      }
    } finally {
      setClaimingId(null);
    }
  };

  const getThresholdText = (minSpend) => {
    if (!minSpend || minSpend <= 0) return '无门槛';
    return `满${minSpend}可用`;
  };

  const isExpired = (validTo) => {
    return validTo && dayjs(validTo).isBefore(dayjs());
  };

  const renderCouponCard = (item) => {
    const claimed = claimedIds.has(item.id);
    const expired = isExpired(item.validTo);
    const isClaiming = claimingId === item.id;

    return (
      <View className={`hotel-coupon-card ${expired ? 'coupon-card-expired' : ''}`} key={item.id}>
        {/* 左侧内容区 */}
        <View className='coupon-content-left'>
          <View className='coupon-tags-row'>
            <View className='tag-item tag-blue'>优惠券</View>
            {expired && <View className='tag-item tag-gray'>已过期</View>}
          </View>
          <View className='coupon-main-title'>{item.name}</View>
          {item.description ? (
            <View className='coupon-desc-text'>{item.description}</View>
          ) : null}
          <View className='coupon-footer-info'>
            <Text className='expire-date-text'>
              {item.validTo ? `${dayjs(item.validTo).format('YYYY-MM-DD')} 到期` : ''}
            </Text>
          </View>
        </View>

        {/* 装饰分割线 */}
        <View className='coupon-divider-line'></View>

        {/* 右侧操作区 */}
        <View className='coupon-action-right'>
          <View className='amount-display-box'>
            <Text className='amount-value'>{item.discount}</Text>
            <Text className='amount-unit'>元</Text>
          </View>
          <View className='threshold-text'>{getThresholdText(item.minSpend)}</View>

          {expired ? (
            <View className='coupon-btn-disabled'>已过期</View>
          ) : claimed ? (
            <View className='coupon-btn-claimed'>已领取</View>
          ) : (
            <View
              className={`coupon-primary-btn ${isClaiming ? 'coupon-btn-loading' : ''}`}
              onClick={() => handleClaim(item.id)}
            >
              {isClaiming ? '领取中' : (item.points > 0 ? `${item.points}积分兑换` : '立即领取')}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className='coupons-page-container' style={cssVars}>
        <Skeleton type='list' />
      </View>
    );
  }

  return (
    <View className='coupons-page-container' style={cssVars}>
      <View className='coupon-list-box'>
        {couponList.length > 0 ? (
          couponList.map(item => renderCouponCard(item))
        ) : (
          <EmptyState
            image='📋'
            title='暂无可用优惠券'
            description='暂时没有可领取的优惠券'
          />
        )}
      </View>
    </View>
  );
}

export default Coupons;
