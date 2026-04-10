'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Result
        status="error"
        title="出错了"
        subTitle={error.message || '页面加载失败，请稍后重试'}
        extra={[
          <Button type="primary" key="retry" onClick={reset}>
            重试
          </Button>,
          <Button key="home" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        ]}
      />
    </div>
  );
}
