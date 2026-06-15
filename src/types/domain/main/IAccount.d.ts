import type { IShop, IToken } from '@/types';

/**
 * 스마트CS 계정 정보
 */
export interface IAccount {
  /** 식별자 */
  id?: string;
  /** 이름 */
  name?: string;
  /** 정규직원 여부 */
  isRegularEmployee?: boolean;
  /** 로그인 아이디 */
  loginId: string;
  /** 사번 */
  employeeNumber?: string;
  /** 계정 토큰 정보 */
  token?: IToken;
  /** 로그인 아이디 저장 여부 */
  isSaveLoginId?: boolean;
}

/**
 * 디바이스 정보
 */
export interface IDeviceInfo {
  deviceOSName: string;
  deviceId: string;
  deviceModelName: string;
  appVersion: string;
}
