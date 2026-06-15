// src/app/layout.tsx
import '@mantine/core/styles.css'; // Mantine 핵심 스타일 임포트
import '@mantine/notifications/styles.css'; // Notifications 스타일 임포트
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { UIProvider } from '@/providers/uiProvider';

import {logger} from '@/utils';

export const metadata = {
  title: 'Next.js Mantine App',
  description: 'Mantine v7 + Next.js App Router Template',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  logger.info('RootLayout rendered..');
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* FOUC(스타일 깨짐)을 방지하는 스크립트 (반드시 head 안에 위치) */}
        <ColorSchemeScript />
      </head>
      <body>
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  );
}
