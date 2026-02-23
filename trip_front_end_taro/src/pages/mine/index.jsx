import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { logout } from '../../services/auth';
import { getMyFavorites } from '../../services/favorite';
import { getMyBookings } from '../../services/booking';
import { getUserCoupons } from '../../services/coupon';
import { getUserProfile } from '../../services/user';
import { storage } from '../../utils/storage';
import { useTheme } from '../../utils/useTheme';
import { getSavedTheme, saveTheme, resolveTheme, applyNativeTheme, THEME } from '../../utils/theme';
import Icon from '../../components/Icon';
import AiChatWidget from '../../components/AiChatWidget';
import './index.css';

function Mine() {
  const { cssVars, tokens } = useTheme();

  // 主题偏好状态
  const [themePreference, setThemePreference] = useState(getSavedTheme());

  const handleThemeSelect = (pref) => {
    setThemePreference(pref);
    saveTheme(pref);
    const resolved = resolveTheme();
    applyNativeTheme(resolved);
    Taro.eventCenter.trigger('themeChanged', resolved);
  };

  // 登录状态和用户信息
  const [isLogin, setIsLogin] = useState(false);
  const [user, setUser] = useState(null);

  // 统计数据
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [couponCount, setCouponCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useDidShow(() => {
    checkAuth();
    if (storage.isAuthenticated()) {
      loadUserStats();
    }
  });

  const checkAuth = () => {
    const loggedIn = storage.isAuthenticated();
    setIsLogin(loggedIn);
    if (loggedIn) {
      const userInfo = storage.getUser();
      setUser(userInfo);
    } else {
      setFavoriteCount(0);
      setCouponCount(0);
    }
  };

  const loadUserStats = async () => {
    setStatsLoading(true);
    try {
      const [favoritesRes, bookingsRes, profileRes, couponsRes] = await Promise.all([
        getMyFavorites(),
        getMyBookings(),
        getUserProfile(),
        getUserCoupons()
      ]);
      if (favoritesRes.success && favoritesRes.data) setFavoriteCount(favoritesRes.data.length);
      if (bookingsRes.success && bookingsRes.data) setOrderCount(bookingsRes.data.length);
      if (profileRes.success && profileRes.data) setPoints(profileRes.data.points || 0);
      if (couponsRes.success && couponsRes.data) setCouponCount(couponsRes.data.length);
      if (profileRes.success && profileRes.data) setPoints(profileRes.data.points || 0);
    } catch (error) {
      console.error('加载用户统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogin = () => Taro.navigateTo({ url: '/pages/login/index' });
  const handleRegister = () => Taro.navigateTo({ url: '/pages/register/index' });

  const handleMyFavorites = () => {
    if (!isLogin) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500);
      return;
    }
    Taro.navigateTo({ url: '/pages/favoriteList/index' });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          await logout();
          setIsLogin(false);
          setUser(null);
        }
      }
    });
  };

  const handleMyOrders = () => {
    if (!isLogin) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500);
      return;
    }
    Taro.navigateTo({ url: '/pages/orderList/index' });
  };

  const handleFeedback = () => {
    Taro.showModal({
      title: '意见反馈',
      content: '感谢您对该软件的支持！如有反馈意见请联系邮箱：support@trip.com',
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  const handleAbout = () => {
    Taro.showModal({
      title: '关于系统',
      content: '当前版本：1.0.0\n本系统由 Trip Team 开发，旨在为您提供优质的酒店预订服务。',
      showCancel: false,
      confirmText: '好的'
    });
  };

  return (
    <View className='mine-container' style={cssVars}>
      {/* 1. 顶部用户信息区域 */}
      <View className='user-header-box'>
        <View className='avatar-circle'>
          <Icon name='userCircle' size={96} color='rgba(255, 255, 255, 0.9)' />
        </View>
        <View className='user-text-info'>
          <Text className='user-name-title'>{isLogin && user ? user.name : '未登录'}</Text>
          <Text className='user-sub-status'>{isLogin ? '欢迎回来' : '点击下方按钮登录'}</Text>
        </View>
      </View>

      {/* 2. 横向导航菜单 */}
      <View className='mine-nav-row'>
        <View className='nav-menu-item' hoverClass='nav-menu-hover' onClick={handleMyFavorites}>
          {statsLoading ? (
            <View className='stat-skeleton' />
          ) : (
            <Text className='nav-val-num'>{favoriteCount}</Text>
          )}
          <Text className='nav-label-text'>我的收藏</Text>
        </View>
        <View className='nav-menu-item' hoverClass='nav-menu-hover' onClick={handleMyOrders}>
          {statsLoading ? (
            <View className='stat-skeleton' />
          ) : (
            <Text className='nav-val-num'>{orderCount}</Text>
          )}
          <Text className='nav-label-text'>我的订单</Text>
        </View>
        <View className='nav-menu-item'>
          <Text className='nav-val-num'>{points}</Text>
          <Text className='nav-label-text'>积分</Text>
        </View>
        <View className='nav-menu-item' hoverClass='nav-menu-hover' onClick={() => Taro.navigateTo({ url: '/pages/myCoupons/index' })}>
          <Text className='nav-val-num'>{couponCount}</Text>
          <Text className='nav-label-text'>优惠券</Text>
        </View>
      </View>

      {/* 3. 登录/注册 或 退出登录 */}
      {!isLogin ? (
        <View className='auth-action-group'>
          <Button className='mine-btn-login' hoverClass='mine-btn-login-hover' onClick={handleLogin}>
            立即登录
          </Button>
          <Button className='mine-btn-register' hoverClass='mine-btn-register-hover' onClick={handleRegister}>
            注册账号
          </Button>
        </View>
      ) : (
        <View className='auth-action-group'>
          <Button className='mine-btn-logout' hoverClass='mine-btn-logout-hover' onClick={handleLogout}>
            <Icon name='signOut' size={32} color={tokens['--color-error']} style={{ marginRight: '12rpx' }} />
            退出登录
          </Button>
        </View>
      )}

      {/* 4. 底部常用功能列表 */}
      <View className='common-list-section'>
        <View className='list-cell-row' hoverClass='list-cell-hover' onClick={() => Taro.navigateTo({ url: '/pages/reviewList/index' })}>
          <View className='cell-left-group'>
            <Icon name='pencilSimple' size={36} color={tokens['--color-text-primary']} style={{ marginRight: '16rpx' }} />
            <Text className='cell-left-text'>我的评价</Text>
          </View>
          <Icon name='caretRight' size={28} color={tokens['--color-text-disabled']} />
        </View>
        <View className='list-cell-row' hoverClass='list-cell-hover' onClick={handleFeedback}>
          <View className='cell-left-group'>
            <Icon name='chatCircle' size={36} color={tokens['--color-text-primary']} style={{ marginRight: '16rpx' }} />
            <Text className='cell-left-text'>意见反馈</Text>
          </View>
          <Icon name='caretRight' size={28} color={tokens['--color-text-disabled']} />
        </View>
        <View className='list-cell-row' hoverClass='list-cell-hover' onClick={handleAbout}>
          <View className='cell-left-group'>
            <Icon name='info' size={36} color={tokens['--color-text-primary']} style={{ marginRight: '16rpx' }} />
            <Text className='cell-left-text'>关于系统</Text>
          </View>
          <Icon name='caretRight' size={28} color={tokens['--color-text-disabled']} />
        </View>
        <View className='list-cell-row no-border theme-picker-row'>
          <Text className='cell-left-text'>显示模式</Text>
          <View className='theme-seg-ctrl'>
            <View
              className={`theme-seg-item${themePreference === THEME.LIGHT ? ' theme-seg-active' : ''}`}
              onClick={() => handleThemeSelect(THEME.LIGHT)}
            >
              <Text className='theme-seg-icon'>☀️</Text>
              <Text className='theme-seg-label'>浅色</Text>
            </View>
            <View
              className={`theme-seg-item${themePreference === THEME.SYSTEM ? ' theme-seg-active' : ''}`}
              onClick={() => handleThemeSelect(THEME.SYSTEM)}
            >
              <Text className='theme-seg-icon'>🌐</Text>
              <Text className='theme-seg-label'>跟随</Text>
            </View>
            <View
              className={`theme-seg-item${themePreference === THEME.DARK ? ' theme-seg-active' : ''}`}
              onClick={() => handleThemeSelect(THEME.DARK)}
            >
              <Text className='theme-seg-icon'>🌙</Text>
              <Text className='theme-seg-label'>深色</Text>
            </View>
          </View>
        </View>
      </View>

{/* AI 助手悬浮按钮 */}
<AiChatWidget />
</View>
  );
}

export default Mine;
