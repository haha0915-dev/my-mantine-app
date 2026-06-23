'use client';

import { useRouter } from 'next/navigation';

import { useMainStore } from '@/providers';
import type { ILoginProps } from '@/types/domain/login';

const TEST_ACCOUNT = {
  id: 'test-001',
  name: '테스트 사용자',
  loginId: 'test',
  employeeNumber: 'EMP001',
  isRegularEmployee: true,
};

export const useLoginHook = () => {
  const router = useRouter();
  const setAccount = useMainStore((state) => state.setAccount);

  const processLogin = (data: ILoginProps) => {
    const temporaryToken = {
      accessToken: `temp-access-token-${data.loginId || TEST_ACCOUNT.loginId}`,
      refreshToken: `temp-refresh-token-${data.loginId || TEST_ACCOUNT.loginId}`,
    };

    setAccount({
      ...TEST_ACCOUNT,
      loginId: data.loginId || TEST_ACCOUNT.loginId,
      token: temporaryToken,
    });

    router.push('/');
  };

  return { processLogin };
};
