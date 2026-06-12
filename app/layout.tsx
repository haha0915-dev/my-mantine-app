// src/app/layout.tsx
import '@mantine/core/styles.css'; // Mantine 핵심 스타일 임포트
import React from 'react';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

export const metadata = {
  title: 'Next.js Mantine App',
  description: 'Mantine v7 + Next.js App Router Template',
};

// 필요한 경우 여기서 테마를 커스텀할 수 있습니다.
const theme = createTheme({
  primaryColor: 'blue',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* FOUC(스타일 깨짐)을 방지하는 스크립트 (반드시 head 안에 위치) */}
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}