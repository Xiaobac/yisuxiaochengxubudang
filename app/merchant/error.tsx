'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

export default function MerchantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Merchant error:', error);
  }, [error]);

  return (
    <div style={{ padding: '48px 24px' }}>
      <Result
        status="error"
        title="商户后台出错"
        subTitle={error.message || '加载失败，请稍后重试'}
        extra={[
          <Button type="primary" key="retry" onClick={reset}>
            重试
          </Button>,
          <Button key="dashboard" onClick={() => window.location.href = '/merchant/dashboard'}>
            返回仪表盘
          </Button>
        ]}
      />
    </div>
  );
}
