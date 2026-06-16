'use client';

import { ReactNode } from 'react';

import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

focusManager.setEventListener((handleFocus) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const onFocus = () => handleFocus(true);
  const onBlur = () => handleFocus(false);
  const onPageShow = () => handleFocus(true);
  const onVisibilityChange = () => handleFocus(document.visibilityState === 'visible');

  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('pageshow', onPageShow);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
});

const queryClient = new QueryClient();

/**
 * react-query 의 provider
 *
 * @param children
 * @constructor
 */
export const ReactQueryProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
