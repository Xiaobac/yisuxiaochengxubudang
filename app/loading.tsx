import { Spin } from 'antd';

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <Spin size="large" description="加载中..." />
    </div>
  );
}
