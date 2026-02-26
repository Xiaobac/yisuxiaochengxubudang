import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Icon from '../Icon';
import { useTheme } from '../../utils/useTheme';
import './index.css';

/**
 * Map of emoji/text hints to Phosphor icon names
 */
const ICON_MAP = {
  '🏨': 'buildings',
  '📋': 'clipboardText',
  '❤️': 'heart',
  '💝': 'heartFill',
  '📝': 'noteBlank',
  '⭐': 'star',
};

/**
 * Empty state component with Phosphor SVG icons
 * @param {string} image - Emoji hint (mapped to icon) or icon name directly
 * @param {string} title - Title text
 * @param {string} description - Description text
 * @param {string} buttonText - Action button text
 * @param {function} onButtonClick - Button click handler
 */
function EmptyState({
  image = 'buildings',
  title = '暂无数据',
  description = '',
  buttonText = '',
  onButtonClick
}) {
  const iconName = ICON_MAP[image] || image;
  const { isDark } = useTheme();

  return (
    <View className='empty-state-container'>
      <View className='empty-state-icon-wrapper'>
        <Icon name={iconName} size={120} color={isDark ? '#555555' : '#bfbfbf'} />
      </View>
      <Text className='empty-state-title'>{title}</Text>
      {description && <Text className='empty-state-description'>{description}</Text>}
      {buttonText && (
        <Button className='empty-state-button' hoverClass='empty-state-button-hover' onClick={onButtonClick}>
          {buttonText}
        </Button>
      )}
    </View>
  );
}

export default EmptyState;
