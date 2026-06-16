'use client';

import { type ReactNode, createContext, useContext } from 'react';

import { useStore } from 'zustand';

import { createMainStore, mainStore, type IMainStore } from '@/stores/mainStore';

/** 메인 스토어 타입 생성 */
export type MainStoreApi = ReturnType<typeof createMainStore>;

/** 메인 스토어 컨텍스트 생성 */
export const MainStoreContext = createContext<MainStoreApi | undefined>(undefined);
const initialMainStoreState = mainStore.getState();

/**
 * 메인 스토어 Provider Props 타입
 */
export interface IMainStoreProviderProps {
  children: ReactNode;
}

/**
 * 메인 스토어 Provider 함수
 *
 * RootLayout 컴포넌트 내에서 사용함
 * @param children
 * @constructor
 */
export const MainStoreProvider = ({ children }: IMainStoreProviderProps) => (
  <MainStoreContext.Provider value={mainStore}>{children}</MainStoreContext.Provider>
);

/**
 * 메인 스토어 Hooks 함수
 *
 * 필요한 컴포넌트 영역 최상위 컴포넌트에서 해당 함수를 호출하여 사용
 *
 * 사용 예시
 * import { useMainStore } from '@/providers';
 * const { shop, selectedAccount, selectedPosCode, setShop } = useMainStore((state) => state);
 *
 * @param selector
 */
export const useMainStore = <T,>(selector: (store: IMainStore) => T): T => {
  const mainStoreContext = useContext(MainStoreContext);

  if (!mainStoreContext) {
    throw new Error('useMainStore must be used within a MainStoreProvider');
  }

  return useStore(mainStoreContext, selector);
};

/**
 * 테스트/스토리북 등에서 상태를 초기화할 때 사용
 */
export const resetMainStoreState = () => {
  mainStore.setState(initialMainStoreState, true);
};
