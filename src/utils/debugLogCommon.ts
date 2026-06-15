// import { mainStore } from '@/stores/mainStore';
import { isDebugLogTesterLoginId } from '@/testers/debug-log';
import { env } from '@/utils/env';

export const DEBUG_LOG_TTL_MS = 48 * 60 * 60 * 1000;
export const DEBUG_LOG_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
export const DEBUG_LOG_TIME_ZONE = 'Asia/Seoul';

const DEBUG_LOG_KST_OFFSET_TEXT = '+09:00';

const debugLogKstDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DEBUG_LOG_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  hourCycle: 'h23',
});

export interface IDebugLogRuntime {
  href?: string;
  online?: boolean;
  userAgent?: string;
  connection?: Record<string, unknown>;
  deviceInfo?: unknown;
  account?: {
    id?: string;
    loginId?: string;
    name?: string;
    employeeNumber?: string;
    isRegularEmployee?: boolean;
    shop?: unknown;
  };
}

export const isDebugLogClient = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

export const isDebugLogEnvironment = () => env.isLocal || env.isDevelopment;

export const getDebugLogKstISOString = (date = new Date()) => {
  const parts = Object.fromEntries(
    debugLogKstDateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}${DEBUG_LOG_KST_OFFSET_TEXT}`;
};

export const getDebugLogTimeMs = (value?: string) => {
  if (!value) return undefined;

  const timeMs = new Date(value).getTime();

  return Number.isNaN(timeMs) ? undefined : timeMs;
};

export const compareDebugLogCreatedAtDesc = <T extends { createdAt: string }>(a: T, b: T) => {
  const aTimeMs = getDebugLogTimeMs(a.createdAt);
  const bTimeMs = getDebugLogTimeMs(b.createdAt);

  if (aTimeMs !== undefined && bTimeMs !== undefined) return bTimeMs - aTimeMs;
  if (aTimeMs !== undefined) return -1;
  if (bTimeMs !== undefined) return 1;

  return a.createdAt < b.createdAt ? 1 : -1;
};

export const isDebugLogEnabled = () => {
  if (!isDebugLogClient()) return false;
  if (env.isLocal) return true;

  // const account = mainStore.getState().account;
  // return env.isDevelopment && isDebugLogTesterLoginId(account?.loginId);
  return isDebugLogTesterLoginId('test01');
};

const getConnectionInfo = () => {
  if (typeof navigator === 'undefined') return undefined;

  const connection = (navigator as Navigator & { connection?: Record<string, unknown> }).connection;
  if (!connection) return undefined;

  return {
    effectiveType: connection.effectiveType,
    type: connection.type,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
};

export const getDebugLogRuntimeInfo = (): IDebugLogRuntime => {
  // const account = mainStore.getState().account;

  return {
    href: typeof window !== 'undefined' ? window.location.href : undefined,
    online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    connection: getConnectionInfo(),
    // deviceInfo: mainStore.getState().deviceInfo,
    // account: account
    //   ? {
    //       id: account.id,
    //       loginId: account.loginId,
    //       name: account.name,
    //       employeeNumber: account.employeeNumber,
    //       isRegularEmployee: account.isRegularEmployee,
    //       shop: account.shop,
    //     }
    //   : undefined,
  };
};

export const getDebugLogSerializationErrorInfo = (error: unknown) => ({
  name: error instanceof Error ? error.name : undefined,
  message: error instanceof Error ? error.message : String(error),
});

const serializeError = (error: Error, depth: number, seen: WeakSet<object>) => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  cause: 'cause' in error ? toDebugLogSafeValue(error.cause, depth + 1, seen) : undefined,
});

export const toDebugLogSafeValue = (value: unknown, depth = 0, seen = new WeakSet<object>()): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'symbol' || typeof value === 'function') return `[${typeof value}]`;
  if (depth > 6) return '[MaxDepth]';
  if (value instanceof Error) return serializeError(value, depth, seen);
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return { kind: 'FormData', note: 'Captured separately as requestBody.' };
  }
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return { kind: 'URLSearchParams', value: Array.from(value.entries()) };
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return {
      kind: typeof File !== 'undefined' && value instanceof File ? 'File' : 'Blob',
      fileName: typeof File !== 'undefined' && value instanceof File ? value.name : undefined,
      type: value.type,
      size: value.size,
      lastModified: typeof File !== 'undefined' && value instanceof File ? value.lastModified : undefined,
    };
  }
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return { kind: 'ArrayBuffer', byteLength: value.byteLength };
  }
  if (ArrayBuffer.isView(value)) {
    return { kind: value.constructor.name, byteLength: value.byteLength };
  }
  if (value instanceof Date) return getDebugLogKstISOString(value);
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[Circular]';

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => toDebugLogSafeValue(item, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      toDebugLogSafeValue(entryValue, depth + 1, seen),
    ]),
  );
};

export const runDebugLogSafely = async (callback: () => Promise<void>) => {
  try {
    await callback();
  } catch {
    // 디버그 로그 저장 실패가 실제 업무 흐름을 막지 않도록 삼킨다.
  }
};
