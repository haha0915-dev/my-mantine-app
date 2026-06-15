import config from './debug-log-tester.json';

const normalizeLoginId = (loginId?: string): string => (loginId ?? '').trim().toLowerCase();

const raw = (config as { loginIds?: string[] }).loginIds;

export const DEBUG_LOG_TESTER_LOGIN_IDS = new Set(Array.isArray(raw) ? raw.map(normalizeLoginId).filter(Boolean) : []);

export const isDebugLogTesterLoginId = (loginId?: string): boolean =>
  DEBUG_LOG_TESTER_LOGIN_IDS.has(normalizeLoginId(loginId));
