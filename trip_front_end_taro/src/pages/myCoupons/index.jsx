import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getUserCoupons } from '../../services/coupon';
import dayjs from 'dayjs';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import { useTheme } from '../../utils/useTheme';
import './index.css';

function MyCoupons() {
  const { cssVars } = useTheme();
  const [couponList, setCouponList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getUserCoupons();
      if (res.success && res.data) {
        setCouponList(res.data);
      }
    } catch (error) {
      console.error('加载优惠券数据失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const getThresholdText = (minSpend) => {
    if (!minSpend || minSpend <= 0) return '无门槛';
    return `满${minSpend}可用`;
  };

  const isExpired = (validTo) => {
    return validTo && dayjs(validTo).isBefore(dayjs());
  };

  const handleUse = () => {
    // 跳转到酒店列表页去使用
    Taro.switchTab({ url: '/pages/hotelList/index' });
  };

  const renderCouponCard = (userCoupon) => {
    const item = userCoupon.coupon;
    if (!item) return null;

    const expired = isExpired(item.validTo);
    const used = userCoupon.status === 'USED';

    // 如果未过期也未使用，才显示内容
    // 根据用户需求，这里应该也是展示所有状态，只是样式不同？
    // 用户原话：“不需要已领取或者积分兑换相关的按钮”
    // 所以这里只保留“去使用”按钮，或者如果是过期/已使用状态，显示状态文字即可

    return (
      <View className={`hotel-coupon-card ${expired || used ? 'coupon-card-expired' : ''}`} key={userCoupon.id}>
        {/* 左侧内容区 */}
        <View className='coupon-content-left'>
          <View className='coupon-tags-row'>
            <View className='tag-item tag-blue'>优惠券</View>
            {expired && <View className='tag-item tag-gray'>已过期</View>}
            {used && <View className='tag-item tag-gray'>已使用</View>}
          </View>
          
          <Text className='coupon-main-title'>{item.name}</Text>
          {item.description ? (
             <View className='coupon-desc-text'>{item.description}</View>
          ) : null}
          
          <View className='coupon-footer-info'>
            <Text className='expire-date-text'>
              有效期至：{dayjs(item.validTo).format('YYYY-MM-DD')}
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

          {/* 状态按钮显示 */}
          {expired ? (
            <View className='coupon-btn-disabled'>已过期</View>
          ) : used ? (
            <View className='coupon-btn-disabled'>已使用</View>
          ) : (
            <View className='coupon-primary-btn' onClick={handleUse}>
              去使用
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className='coupons-page-container' style={cssVars}>
      <View className='coupon-list-box'>
        {loading ? (
          <Skeleton type='list' />
        ) : couponList.length > 0 ? (
          couponList.map(item => renderCouponCard(item))
        ) : (
          <EmptyState
            image='clipboardText'
            title='暂无优惠券'
            description='去首页看看有没有可领取的优惠券吧'
          />
        )}
      </View>
    </View>
  );
}

export default MyCoupons;
