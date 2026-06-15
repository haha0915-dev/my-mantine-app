import { recordConsoleLog, type ConsoleLogLevel } from '@/utils/consoleLogStorage';

const env = process.env.NEXT_PUBLIC_APP_ENV ?? 'production'; // 환경 변수 로딩에 실패하면 로그 출력 안함
const isDevelopmentOrStaging = env === 'local' || env === 'development' || env === 'staging';

/**
 *   QA가 브라우저에서 임시로 켜고 끄도록 로컬플래그 지원
 *   운영 로그 켜기 : localStorage.setItem('debugLogs', 'true') -> refreshDebugOverride()
 *   운영 로그 끄기 : localStorage.removeItem('debugLogs') -> refreshDebugOverride()
 */

let debugOverride: boolean | null = null;

const readDebugOverride = () => {
  try {
    return localStorage.getItem('debugLogs') === 'true';
  } catch {
    return false;
  }
};

export const refreshDebugOverride = () => {
  debugOverride = readDebugOverride();
};

const isDebugOverride = () => {
  if (debugOverride !== null) return debugOverride;
  debugOverride = readDebugOverride();
  return debugOverride;
};

const shouldLog = () => {
  if (isDevelopmentOrStaging) return true;
  return isDebugOverride();
};

const writeLog = (level: ConsoleLogLevel, prefix: string, args: unknown[]) => {
  if (!shouldLog()) return;


  console[level](prefix, ...args);
  void recordConsoleLog(level, args);
};

export const logger = {
  log: (...args: unknown[]) => {
    writeLog('log', '[LOG]', args);
  },
  info: (...args: unknown[]) => {
    writeLog('info', '[INFO]', args);
  },
  warn: (...args: unknown[]) => {
    writeLog('warn', '[WARN]', args);
  },
  error: (...args: unknown[]) => {
    writeLog('error', '[ERROR]', args);
  },
  debug: (...args: unknown[]) => {
    writeLog('debug', '[DEBUG]', args);
  },
};
