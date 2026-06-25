/**
 * Global Alert 을 사용하기 위한 store 설정
 */
import dayjs from 'dayjs';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

import type { ITimerInfo } from '@/types/domain/main';
import type { StateStorage } from 'zustand/middleware';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const TIMER_STORE_STORAGE_KEY = 'timerStore';

const timerStoreSessionStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionValue = window.sessionStorage.getItem(name);
    if (sessionValue !== null) {
      return sessionValue;
    }

    // 기존 배포에서 localStorage에 저장된 타이머는 같은 탭 세션으로 1회 이관합니다.
    const legacyValue = window.localStorage.getItem(name);
    if (legacyValue !== null) {
      window.sessionStorage.setItem(name, legacyValue);
      window.localStorage.removeItem(name);
    }

    return legacyValue;
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem(name);
    window.localStorage.removeItem(name);
  },
};

// Zustand 스토어의 상태 인터페이스 정의
export interface ITimerState {
  /** 타이머 목록 정보 */
  timerInfoList?: ITimerInfo[];
}

export interface ITimerActions {
  /** 타이머 정보 목록 등록 함수 */
  setTimerInfoList: (timerInfoList: ITimerInfo[]) => void;
  /** 타이머 정보 전체 초기화 함수 */
  resetTimerStore: () => void;
  /** 타이머 정보 등록 함수 */
  addTimerInfo: (timerInfo: ITimerInfo) => void;
  /** 기 등록된 타이머 정보 중 시작일시를 수정 함수 */
  resetTimerInfo: (key: string) => void;
  /** 기 등록된 타이머 정보를 선택 삭제 함수 */
  clearTimerInfo: (key: string | string[]) => void;
}

export type ITimerStore = ITimerState & ITimerActions;

export const defaultInitTimerState: ITimerState = {
  timerInfoList: [],
};

// Zustand 스토어 생성
const useTimerStore = createStore<ITimerStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultInitTimerState,
        setTimerInfoList: (newTimerInfoList: ITimerInfo[]) =>
          set((state: ITimerStore) => ({ ...state, timerInfoList: newTimerInfoList })),
        resetTimerStore: () => set((state: ITimerStore) => ({ ...state, ...defaultInitTimerState })),
        addTimerInfo: (newTimerInfo: ITimerInfo) =>
          set((state: ITimerStore) => {
            if (state.timerInfoList) {
              const index = state.timerInfoList.findIndex((ti) => ti.key === newTimerInfo.key);
              if (index > -1) {
                state.timerInfoList[index] = { ...newTimerInfo };
                return { ...state, timerInfoList: [...state.timerInfoList] };
              } else {
                return { ...state, timerInfoList: [...state.timerInfoList, newTimerInfo] };
              }
            } else {
              return { ...state, timerInfoList: [newTimerInfo] };
            }
          }),
        resetTimerInfo: (key: string) =>
          set((state: ITimerStore) => {
            if (!state.timerInfoList || state.timerInfoList.length === 0) {
              return { ...state };
            }
            return {
              ...state,
              timerInfoList: [
                ...state.timerInfoList.map((ti) => ({
                  ...ti,
                  startTime: ti.key === key ? dayjs().toDate().getTime() : ti.startTime,
                })),
              ],
            };
          }),
        clearTimerInfo: (key: string | string[]) =>
          set((state: ITimerStore) => {
            if (!state.timerInfoList || state.timerInfoList.length === 0) {
              return { ...state };
            }
            return {
              ...state,
              timerInfoList: [
                ...state.timerInfoList.filter((ti) => {
                  if (typeof key === 'string') {
                    return ti.key !== key;
                  } else {
                    return !key.includes(ti.key);
                  }
                }),
              ],
            };
          }),
      }),
      {
        name: TIMER_STORE_STORAGE_KEY,
        storage: createJSONStorage(() => (typeof window !== 'undefined' ? timerStoreSessionStorage : noopStorage)),
      },
    ),
    { name: 'timerStore', serialize: { options: true }, enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production' },
  ),
);

export { useTimerStore };
