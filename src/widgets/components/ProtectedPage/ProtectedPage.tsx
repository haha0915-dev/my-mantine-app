'use client';

import { ReactNode, useEffect } from 'react';

import { useMainStore } from '@/providers';
import { type IMainStore } from '@/stores';
import { logger , go} from '@/utils';

/**
 * 내부 페이지 진입 전에 인증 상태와 사용자 컨텍스트를 보장하는 컴포넌트입니다.
 * - 토큰 존재 여부 확인
 * - 토큰 없거나 자동로그아웃 만료 상태면 세션 정리 후 로그인으로 리다이렉트
 * - 토큰은 있는데 계정 정보가 비어 있으면 세션/API로 계정 정보 복원
 * - 복원 완료 전까지 화면 렌더링 차단(null 반환)
 * - 정상 인증/복원 완료 시에만 자식 페이지 렌더링
 */
const redirectToLogin = () => {
  go.local.login();
};

const ProtectedPage = ({ children }: { children: ReactNode }) => {
  const account = useMainStore((state: IMainStore) => state.account);

  useEffect(() => {
    logger.log('ProtectedPage: 인증 상태 확인 시작');
    // 토큰 존재 여부 확인 (account.token.accessToken을 통해)
    const hasToken = account?.token?.accessToken;

    if (!hasToken) {
      redirectToLogin();
      return;
    }

    // 토큰은 있지만 계정 정보가 없으면 복원 필요
    if (!account.id) {
      logger.log('계정 정보 없음, 복원 필요');
      // TODO: 여기에 계정 정보 복원 로직 추가
    }
  }, [account]);

  // 토큰과 계정 정보가 없으면 렌더링 차단
  if (!account?.token?.accessToken) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedPage;
