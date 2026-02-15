import { View, Text } from '@tarojs/components';
import './index.css';

function Coupons() {
  // 定义不同卡片的配置数据
  const couponListData = [
    {
      id: 1,
      title: '酒店神券',
      amount: 10,
      unit: '元',
      thresholdText: '满减券',
      expireDate: '2026-02-20',
      tagText: '神券',
      tagColorClass: 'tag-blue'
    },
    {
      id: 2,
      title: '民宿特惠',
      amount: 20,
      unit: '元',
      thresholdText: '满199可用',
      expireDate: '2026-03-15',
      tagText: '特惠',
      tagColorClass: 'tag-orange'
    },
    {
      id: 3,
      title: '打车券',
      amount: 5,
      unit: '元',
      thresholdText: '无门槛',
      expireDate: '2026-02-28',
      tagText: '神券',
      tagColorClass: 'tag-blue'
    }
  ];

  // 内部函数：根据数据渲染单张卡片（不导出为组件，仅内部使用）
  const renderCouponCard = (data) => (
    <View className='hotel-coupon-card' key={data.id}>
      {/* 左侧内容区 */}
      <View className='coupon-content-left'>
        <View className='coupon-tags-row'>
          <View className={`tag-item ${data.tagColorClass}`}>{data.tagText}</View>
        </View>
        <View className='coupon-main-title'>{data.title}</View>
        <View className='coupon-footer-info'>
          <Text className='expire-date-text'>{data.expireDate} 到期</Text>
        </View>
      </View>

      {/* 装饰分割线 */}
      <View className='coupon-divider-line'></View>

      {/* 右侧操作区 */}
      <View className='coupon-action-right'>
        <View className='amount-display-box'>
          <Text className='amount-value'>{data.amount}</Text>
          <Text className='amount-unit'>{data.unit}</Text>
        </View>
        <View className='threshold-text'>{data.thresholdText}</View>
        <View className='coupon-primary-btn'>去使用</View>
      </View>
    </View>
  );

  return (
    <View className='coupons-page-container'>
      <View className='coupon-list-box'>
        {/* 通过 map 循环渲染多张卡片 */}
        {couponListData.map(item => renderCouponCard(item))}
      </View>
    </View>
  );
}

export default Coupons;