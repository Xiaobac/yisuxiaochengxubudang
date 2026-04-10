import { Spin, Card } from 'antd';

export default function MerchantLoading() {
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <Spin size="large" description="加载数据中..." />
        </div>
      </Card>
    </div>
  );
}
