import React, { useMemo } from 'react';
import { Image } from '@tarojs/components';
import { getIconUri } from '../../utils/icons';
import { useTheme } from '../../utils/useTheme';

/**
 * Phosphor-style Icon component
 * Uses SVG data URIs rendered via Image component for Taro mini-program compatibility.
 * @param {string} name - Icon name from ICON_PATHS (e.g. 'arrowLeft', 'heart')
 * @param {number} size - Icon size in rpx (default 40)
 * @param {string} color - Icon color (defaults to theme text-secondary color)
 * @param {string} className - Additional CSS class
 * @param {object} style - Additional inline styles
 * @param {function} onClick - Click handler
 */
function Icon({ name, size = 40, color, className = '', style = {}, onClick }) {
  const { tokens } = useTheme();
  const iconColor = color || tokens['--color-text-secondary'];
  const src = useMemo(() => getIconUri(name, iconColor), [name, iconColor]);

  if (!src) return null;

  return (
    <Image
      className={`icon-base ${className}`}
      src={src}
      mode='aspectFit'
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        ...style,
      }}
      onClick={onClick}
    />
  );
}

export default Icon;
