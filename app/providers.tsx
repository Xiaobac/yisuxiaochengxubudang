'use client';

import { ConfigProvider, App, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: antdTheme.defaultAlgorithm,
          cssVar: { prefix: 'ant' },
          hashed: false,
          token: {
            colorPrimary: '#1677ff',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
