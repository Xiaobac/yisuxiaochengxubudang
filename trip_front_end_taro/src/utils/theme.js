/**
 * 主题管理工具
 * 支持：跟随系统 / 手动亮色 / 手动深色
 * 对齐 YouTube --yt-spec-* 方案：CSS 变量集中管理，切换时通过 style 注入根节点
 */
import Taro from '@tarojs/taro';
import { storage } from './storage';

export const THEME = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

const THEME_KEY = 'app_theme';

/**
 * CSS 变量 Token 映射（单一数据源）
 * 命名规范：--color-[功能]-[层级]，语义化，不含颜色词
 */
const TOKENS = {
  light: {
    '--color-primary': '#0066FF',
    '--color-primary-light': '#4A90E2',
    '--color-primary-dark': '#0052CC',
    '--color-primary-gradient': 'linear-gradient(135deg, #0066FF 0%, #4A90E2 100%)',
    '--color-header-bg': '#1677ff',
    '--color-secondary': '#FF6B00',
    '--color-secondary-light': '#FF8E53',
    '--color-success': '#52C41A',
    '--color-warning': '#FAAD14',
    '--color-error': '#FF4D4F',
    '--color-info': '#1890FF',
    '--color-price': '#FF6B00',
    '--color-price-light': '#FF8E53',
    '--color-price-gradient': 'linear-gradient(135deg, #FF6B00 0%, #FF8E53 100%)',
    '--color-star': '#FF9A03',
    '--color-coupon-accent': '#FFDA00',
    '--color-bg-base': '#ffffff',
    '--color-bg-secondary': '#f8f9fa',
    '--color-bg-tertiary': '#f0f2f5',
    '--color-bg-overlay': 'rgba(0, 0, 0, 0.45)',
    '--color-card-bg': '#ffffff',
    '--color-text-primary': '#1a1a1a',
    '--color-text-secondary': '#666666',
    '--color-text-tertiary': '#999999',
    '--color-text-disabled': '#cccccc',
    '--color-border-base': '#e5e7eb',
    '--color-border-light': '#f0f2f5',
    '--color-border-dark': '#d1d5db',
    '--shadow-sm': '0 2rpx 8rpx rgba(0,0,0,0.04)',
    '--shadow-md': '0 4rpx 16rpx rgba(0,0,0,0.08)',
    '--shadow-lg': '0 8rpx 24rpx rgba(0,0,0,0.12)',
  },
  dark: {
    '--color-primary': '#4a90e2',
    '--color-primary-light': '#6BA5E7',
    '--color-primary-dark': '#3A7BD5',
    '--color-primary-gradient': 'linear-gradient(135deg, #4a90e2 0%, #6BA5E7 100%)',
    '--color-header-bg': '#1a2332',
    '--color-secondary': '#FF8E53',
    '--color-secondary-light': '#FFB088',
    '--color-success': '#73D13D',
    '--color-warning': '#FFC53D',
    '--color-error': '#FF7875',
    '--color-info': '#40A9FF',
    '--color-price': '#FF8E53',
    '--color-price-light': '#FFB088',
    '--color-price-gradient': 'linear-gradient(135deg, #FF8E53 0%, #FFB088 100%)',
    '--color-star': '#FFB347',
    '--color-coupon-accent': '#FFE566',
    '--color-bg-base': '#1a1a1a',
    '--color-bg-secondary': '#242424',
    '--color-bg-tertiary': '#2a2a2a',
    '--color-bg-overlay': 'rgba(0, 0, 0, 0.65)',
    '--color-card-bg': '#242424',
    '--color-text-primary': '#e0e0e0',
    '--color-text-secondary': '#a0a0a0',
    '--color-text-tertiary': '#666666',
    '--color-text-disabled': '#444444',
    '--color-border-base': '#333333',
    '--color-border-light': '#2a2a2a',
    '--color-border-dark': '#444444',
    '--shadow-sm': '0 2rpx 8rpx rgba(0,0,0,0.3)',
    '--shadow-md': '0 4rpx 16rpx rgba(0,0,0,0.4)',
    '--shadow-lg': '0 8rpx 24rpx rgba(0,0,0,0.5)',
  },
};

export function getSavedTheme() {
  return storage.get(THEME_KEY, THEME.SYSTEM);
}

export function saveTheme(theme) {
  storage.set(THEME_KEY, theme);
}

export function getSystemIsDark() {
  try {
    return Taro.getSystemInfoSync().theme === 'dark';
  } catch {
    return false;
  }
}

/**
 * 根据用户偏好和系统主题，解析出实际应使用的主题
 * @returns {'light'|'dark'}
 */
export function resolveTheme() {
  const saved = getSavedTheme();
  if (saved === THEME.LIGHT) return 'light';
  if (saved === THEME.DARK) return 'dark';
  return getSystemIsDark() ? 'dark' : 'light';
}

/**
 * 生成 CSS 变量字符串，绑定到页面根 View 的 style 属性
 * 等同于 YouTube 在 <html> 节点上注入 --yt-spec-* 变量
 * @param {'light'|'dark'} resolvedTheme
 * @returns {string} 如 "--color-bg-base:#1a1a1a;--color-text-primary:#e0e0e0"
 */
export function getThemeCssVars(resolvedTheme) {
  const tokens = TOKENS[resolvedTheme] || TOKENS.light;
  return Object.entries(tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

/**
 * 获取已解析主题的 token 值对象
 * 用于 JS 层面需要主题色的场景（如 Icon 的 SVG data URI 不支持 CSS 变量）
 * @param {'light'|'dark'} resolvedTheme
 * @returns {Record<string, string>} 如 { '--color-primary': '#1677ff', ... }
 */
export function getResolvedTokens(resolvedTheme) {
  return TOKENS[resolvedTheme] || TOKENS.light;
}

/**
 * 应用原生 UI 主题（NavigationBar + TabBar）
 * 必须在每个页面 useDidShow 中调用，因为 setNavigationBarColor 是页面级 API
 * @param {'light'|'dark'} resolvedTheme
 */
export function applyNativeTheme(resolvedTheme) {
  const isDark = resolvedTheme === 'dark';

  Taro.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: TOKENS[resolvedTheme]['--color-header-bg'],
    animation: { duration: 200, timingFunc: 'linear' },
  });

  try {
    Taro.setTabBarStyle({
      color: isDark ? '#888888' : '#999999',
      selectedColor: isDark ? '#4a90e2' : '#1677ff',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderStyle: isDark ? 'white' : 'black',
    });
  } catch {
    // 部分平台/页面不支持 setTabBarStyle，静默忽略
  }
}
