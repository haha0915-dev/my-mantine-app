import { DeviceOSTypeEnum } from '@/enums';
import type { IAccount, IDeviceInfo } from '@/types/domain/main';
import { createJSONStorage, devtools, persist, type StateStorage } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';

/**
 * 매인 스토어의 상태관리 정보
 */
export interface IMainState {
  /** 로그인한 계정 정보 */
  account?: IAccount;
  /** 선택된 유치자(담당자) 계정 정보 */
  selectedAccount?: IAccount;
  /** 선택된 업무 기기 정보 */
  selectedDeviceType?: string;
  /** 디바이스 정보 */
  deviceInfo?: IDeviceInfo;
}

/**
 * 메인 스토어의 함수 정보
 */
export interface IMainActions {
  /** 선택된 업무 기기정보 등록 함수 */
  setSelectedDeviceType: (value: string) => void;
  /** 로그인한 계정 정보 등록 함수 */
  setAccount: (newAccount: IAccount) => void;
  /** 선택된 유치자(담당자) 계정 정보 등록 함수 */
  setSelectedAccount: (selectedAccount: IAccount) => void;
  /** 디바이스 정보 등록 함수 */
  setDeviceInfo: (newDeviceInfo: IDeviceInfo) => void;
  /** 메인 스토어 초기화 함수 */
  resetMainStore: () => void;
}

/** 메인 스토어 타입 정의 */
export type IMainStore = IMainState & IMainActions;

/** 메인 스토어의 기본(초기) 값 설정 */
export const defaultInitMainState: IMainState = {
  deviceInfo: {
    deviceOSName: DeviceOSTypeEnum.PC,
    deviceId: 'none',
    deviceModelName: 'Web Browser',
    appVersion: 'none',
  },
};

/** SSR 환경에서 window/localStorage 없이 동작하도록 하는 noop 스토리지 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * 메인 스토어 생성 함수
 * @param initState
 */
export const createMainStore = (initState: IMainState = defaultInitMainState): StoreApi<IMainStore> =>
  createStore<IMainStore>()(
    devtools(
      persist(
        (set) => ({
          ...initState,
          setSelectedDeviceType: (value: string) => set({ selectedDeviceType: value }),
          setAccount: (newAccount: IAccount) => set({ account: newAccount }),
          setSelectedAccount: (newSelectedAccount: IAccount) =>
            set({ selectedAccount: newSelectedAccount }),
          setDeviceInfo: (newDeviceInfo: IDeviceInfo) =>
            set({ deviceInfo: newDeviceInfo }),
          resetMainStore: () =>
            set((state) => ({
              ...state,

              selectedDeviceType: undefined,
              selectedAccount: undefined,
            })),
        }),
        {
          name: 'mainStore',
          storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : noopStorage)),
        },
      ),
      { name: 'mainStore', enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production' },
    ),
  );

/** 전역에서 재사용할 기본 메인 스토어 인스턴스 */
export const mainStore = createMainStore(defaultInitMainState);
