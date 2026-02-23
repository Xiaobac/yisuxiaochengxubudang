import React from 'react';
import { View } from '@tarojs/components';
import './index.css';

/**
 * Skeleton loading placeholder component.
 * Renders content-shaped shimmer blocks to improve perceived loading speed.
 *
 * @param {'hotelCard'|'hotelDetail'|'orderCard'|'text'|'avatar'|'image'} type
 * @param {number} count - Number of skeleton items to render (for list types)
 * @param {'shimmer'|'pulse'} animationType - Animation style
 */
function Skeleton({ type = 'hotelCard', count = 3, animationType = 'shimmer' }) {
  const anim = animationType === 'pulse' ? 'skeleton-pulse' : 'skeleton-shimmer';

  if (type === 'hotelCard') {
    return (
      <View className='skeleton-list'>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} className='skeleton-hotel-card'>
            <View className={`skeleton-hotel-img ${anim}`} />
            <View className='skeleton-hotel-info'>
              <View className={`skeleton-line skeleton-line-title ${anim}`} />
              <View className={`skeleton-line skeleton-line-short ${anim}`} />
              <View className={`skeleton-line skeleton-line-medium ${anim}`} />
              <View className='skeleton-tags-row'>
                <View className={`skeleton-tag ${anim}`} />
                <View className={`skeleton-tag ${anim}`} />
              </View>
              <View className='skeleton-price-row'>
                <View className={`skeleton-line skeleton-line-price ${anim}`} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'hotelDetail') {
    return (
      <View className='skeleton-detail'>
        <View className={`skeleton-detail-banner ${anim}`} />
        <View className='skeleton-detail-card'>
          <View className={`skeleton-line skeleton-line-title ${anim}`} />
          <View className={`skeleton-line skeleton-line-medium ${anim}`} />
          <View className='skeleton-facility-row'>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className='skeleton-facility-item'>
                <View className={`skeleton-circle ${anim}`} />
                <View className={`skeleton-line skeleton-line-tag ${anim}`} />
              </View>
            ))}
          </View>
          <View className='skeleton-divider' />
          <View className={`skeleton-line skeleton-line-medium ${anim}`} />
          <View className={`skeleton-line skeleton-line-short ${anim}`} />
        </View>
        <View className='skeleton-detail-card'>
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={i} className='skeleton-room-row'>
              <View className={`skeleton-room-img ${anim}`} />
              <View className='skeleton-room-info'>
                <View className={`skeleton-line skeleton-line-title ${anim}`} />
                <View className={`skeleton-line skeleton-line-short ${anim}`} />
                <View className={`skeleton-line skeleton-line-price ${anim}`} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (type === 'orderCard') {
    return (
      <View className='skeleton-list'>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} className='skeleton-order-card'>
            <View className='skeleton-order-header'>
              <View className={`skeleton-line skeleton-line-title ${anim}`} />
              <View className={`skeleton-line skeleton-line-tag ${anim}`} />
            </View>
            <View className='skeleton-order-body'>
              {Array.from({ length: 3 }).map((_, j) => (
                <View key={j} className='skeleton-order-row'>
                  <View className={`skeleton-line skeleton-line-tag ${anim}`} />
                  <View className={`skeleton-line skeleton-line-short ${anim}`} />
                </View>
              ))}
            </View>
            <View className='skeleton-order-footer'>
              <View className={`skeleton-line skeleton-line-price ${anim}`} />
              <View className={`skeleton-btn ${anim}`} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return null;
}

export default Skeleton;
