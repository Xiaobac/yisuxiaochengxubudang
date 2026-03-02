import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { getMyBookings, cancelBooking } from '../../services/booking';
import { formatDate, formatPrice } from '../../utils/format';
import { storage } from '../../utils/storage';
import { getStatusText, getStatusColor } from '../../utils/status';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../utils/useTheme';
import './index.css';
import AiChatWidget from '../../components/AiChatWidget';

function OrderList() {
  const { cssVars, tokens } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    checkAuthAndLoadOrders();
  }, []);

  const checkAuthAndLoadOrders = async () => {
    if (!storage.isAuthenticated()) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500);
      return;
    }
    await loadOrders();
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await getMyBookings();

      if (res.success && res.data) {
        const transformedOrders = res.data.map(order => ({
          id: order.id,
          hotelId: order.hotel?.id || order.hotelId,
          hotelName: order.hotel?.nameZh || order.hotel?.name || '未知酒店',
          hotelAddress: order.hotel?.address || '地址未知',
          checkInDate: formatDate(order.checkInDate, 'MM月DD日'),
          checkOutDate: formatDate(order.checkOutDate, 'MM月DD日'),
          roomType: order.roomType?.nameZh || order.roomType?.name || '未知房型',
          totalPrice: formatPrice(order.totalPrice || 0),
          status: order.status || 'pending',
          statusText: getStatusText(order.status),
          statusColor: getStatusColor(order.status, tokens),
          paymentMethod: '在线支付',
          guestCount: order.guestCount || 1,
          createdAt: formatDate(order.createdAt, 'YYYY-MM-DD HH:mm'),
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId, hotelName) => {
    if (cancellingId === orderId) return;
    Taro.showModal({
      title: '取消订单',
      content: `确定要取消【${hotelName}】的订单吗？`,
      success: async (res) => {
        if (res.confirm) {
          setCancellingId(orderId);
          try {
            const result = await cancelBooking(orderId);
            if (result.success) {
              Taro.showToast({ title: '取消成功', icon: 'success' });
              loadOrders();
            }
          } catch (error) {
            console.error('取消订单失败:', error);
            Taro.showToast({ title: '取消失败，请重试', icon: 'none' });
          } finally {
            setCancellingId(null);
          }
        }
      }
    });
  };

  const handleReviewOrder = (orderId, hotelId, hotelName) => {
    Taro.navigateTo({
      url: `/pages/submitReview/index?orderId=${orderId}&hotelId=${hotelId}&hotelName=${encodeURIComponent(hotelName)}`
    });
  };

  const handleOrderDetail = (orderId) => {
    Taro.navigateTo({ url: `/pages/orderDetail/index?id=${orderId}` });
  };

  usePullDownRefresh(async () => {
    await loadOrders();
    Taro.stopPullDownRefresh();
  });

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  return (
    <View className='order-list-container' style={cssVars}>
      {/* 顶部标签栏 */}
      <View className='order-tabs'>
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待确认' },
          { key: 'confirmed', label: '已确认' },
          { key: 'cancelled', label: '已取消' },
        ].map(tab => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            hoverClass='tab-item-hover'
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className='tab-text'>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 订单列表 */}
      <ScrollView scrollY className='order-scroll'>
        {loading ? (
          <Skeleton type='orderCard' count={3} />
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <View
              key={order.id}
              className='order-card'
              hoverClass='order-card-hover'
              hoverStayTime={100}
            >
              {/* 订单头部 */}
              <View className='order-header'>
                <Text className='order-hotel-name'>{order.hotelName}</Text>
                <Text className='order-status' style={{ color: order.statusColor }}>
                  {order.statusText}
                </Text>
              </View>

              {/* 订单信息 */}
              <View className='order-content'>
                <View className='order-info-row'>
                  <Text className='info-label'>入住日期</Text>
                  <Text className='info-value'>{order.checkInDate}</Text>
                </View>
                <View className='order-info-row'>
                  <Text className='info-label'>离店日期</Text>
                  <Text className='info-value'>{order.checkOutDate}</Text>
                </View>
                <View className='order-info-row'>
                  <Text className='info-label'>房型</Text>
                  <Text className='info-value'>{order.roomType}</Text>
                </View>
                <View className='order-info-row'>
                  <Text className='info-label'>入住人数</Text>
                  <Text className='info-value'>{order.guestCount}人</Text>
                </View>
                <View className='order-info-row'>
                  <Text className='info-label'>酒店地址</Text>
                  <Text className='info-value address'>{order.hotelAddress}</Text>
                </View>
              </View>

              {/* 订单底部 */}
              <View className='order-footer'>
                <View className='order-price-section'>
                  <Text className='price-label'>订单金额</Text>
                  <Text className='price-value'>{order.totalPrice}</Text>
                </View>
                <View className='order-actions'>
                  {order.status === 'pending' && (
                    <View
                      className='action-btn cancel-btn'
                      hoverClass='action-btn-hover'
                      onClick={() => handleCancelOrder(order.id, order.hotelName)}
                    >
                      <Text className='btn-text'>取消订单</Text>
                    </View>
                  )}
                  {order.status === 'completed' && (
                    <View
                      className='action-btn detail-btn'
                      hoverClass='action-btn-hover'
                      onClick={() => handleReviewOrder(order.id, order.hotelId, order.hotelName)}
                    >
                      <Text className='btn-text'>去评价</Text>
                    </View>
                  )}
                  <View
                    className='action-btn detail-btn'
                    hoverClass='action-btn-hover'
                    onClick={() => handleOrderDetail(order.id)}
                  >
                    <Text className='btn-text'>查看详情</Text>
                  </View>
                </View>
              </View>

              {/* 订单时间 */}
              <View className='order-time'>
                <Text className='time-text'>下单时间: {order.createdAt}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            image='clipboardText'
            title='暂无订单'
            description='快去预订心仪的酒店吧~'
            buttonText='去预订'
            onButtonClick={() => Taro.switchTab({ url: '/pages/home/index' })}
          />
        )}
      </ScrollView>
      <AiChatWidget />
    </View>
  );
}

export default OrderList;
