'use client';

import { ConfigProvider, theme as antdTheme, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 避免服务端渲染和客户端不一致
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mounted && theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="hotel-theme"
      enableColorScheme={false}
    >
      <AntdConfigProvider>{children}</AntdConfigProvider>
    </ThemeProvider>
  );
}
