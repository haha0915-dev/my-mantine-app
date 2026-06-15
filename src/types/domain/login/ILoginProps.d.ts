export interface ILoginProps {
  loginId: string;
  loginPw: string;
}

export interface ITwoFactorRequest {
  userId: string;
  verificationCode: string;
}

export interface IToken {
  accessToken?: string;
  refreshToken?: string;
}

export interface IUserInfo {
  userId?: string;
  name?: string;
  isRegularEmployee?: boolean;
}


export interface ISSOLoginResponse {
  userInfo: IUserInfo;
}

export interface ITwoFactorResponse {
  failCount: number;
  token: IToken;
  userInfo: IUserInfo;
}

export interface IResourceTokenResponse {
  query?: string;
}

export interface IResourceTokenLoginRequest {
  query: string;
}

export interface IResourceTokenLoginResponse {
  token: IToken;
  userInfo: IUserInfo;
}
