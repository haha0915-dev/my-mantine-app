import {
  DEBUG_LOG_CLEANUP_INTERVAL_MS,
  compareDebugLogCreatedAtDesc,
  getDebugLogKstISOString,
  getDebugLogRuntimeInfo,
  getDebugLogTimeMs,
  isDebugLogClient,
  isDebugLogEnabled,
  isDebugLogEnvironment,
  runDebugLogSafely,
  toDebugLogSafeValue,
  type IDebugLogRuntime,
} from '@/utils/debugLogCommon';
import { env } from '@/utils/env';

export type ConsoleLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface IConsoleLogEntry {
  logId: string;
  createdAt: string;
  updatedAt: string;
  level: ConsoleLogLevel;
  message: string;
  args: unknown[];
  stack?: string;
  environment?: string;
  runtime?: IDebugLogRuntime;
}

export interface IConsoleLogSummary {
  logId: string;
  createdAt: string;
  updatedAt: string;
  level: ConsoleLogLevel;
  message: string;
  environment?: string;
  href?: string;
}

interface IConsoleLogListOptions {
  level?: ConsoleLogLevel;
  textIncludes?: string;
  limit?: number;
}

export interface IConsoleLogPageCursor {
  logId: string;
  createdAt: string;
}

export interface IConsoleLogSummaryPage {
  items: IConsoleLogSummary[];
  nextCursor?: IConsoleLogPageCursor;
  hasMore: boolean;
}

interface IConsoleLogSummaryPageOptions extends IConsoleLogListOptions {
  cursor?: IConsoleLogPageCursor;
}

const DB_NAME = 'SmartCSConsoleLog';
const DB_VERSION = 3;
const STORE_NAME = 'consoleLogs';
const SUMMARY_STORE_NAME = 'consoleLogSummaries';
const CONSOLE_LOG_TTL_MS = 24 * 60 * 60 * 1000;
const DEBUG_LOG_CLEANUP_SCHEDULE_DELAY_MS = 1000;
const DEBUG_LOG_CLEANUP_BATCH_SIZE = 500;
const CONSOLE_SUMMARY_MESSAGE_MAX_LENGTH = 200;

let lastCleanupAtMs = 0;
let cleanupPromise: Promise<void> | null = null;
let cleanupTimerId: ReturnType<typeof setTimeout> | undefined;
let scheduledCleanupForce = false;

const createConsoleLogId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `console-log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const ensureConsoleLogStoreIndexes = (store: IDBObjectStore) => {
  if (!store.indexNames.contains('createdAt')) {
    store.createIndex('createdAt', 'createdAt');
  }
  if (!store.indexNames.contains('level')) {
    store.createIndex('level', 'level');
  }
  if (!store.indexNames.contains('message')) {
    store.createIndex('message', 'message');
  }
};

const toConsoleSummaryMessage = (message: string) => {
  if (message.length <= CONSOLE_SUMMARY_MESSAGE_MAX_LENGTH) return message;

  return `${message.slice(0, CONSOLE_SUMMARY_MESSAGE_MAX_LENGTH)}...`;
};

const openConsoleLogDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!isDebugLogClient()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const transaction = request.transaction;
      if (!transaction) return;

      const store = db.objectStoreNames.contains(STORE_NAME)
        ? transaction.objectStore(STORE_NAME)
        : db.createObjectStore(STORE_NAME, { keyPath: 'logId' });
      const summaryStore = db.objectStoreNames.contains(SUMMARY_STORE_NAME)
        ? transaction.objectStore(SUMMARY_STORE_NAME)
        : db.createObjectStore(SUMMARY_STORE_NAME, { keyPath: 'logId' });

      ensureConsoleLogStoreIndexes(store);
      ensureConsoleLogStoreIndexes(summaryStore);

      if (event.oldVersion < 3) {
        const cursorRequest = summaryStore.openCursor();

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;

          const summary = cursor.value as IConsoleLogSummary;
          const message = typeof summary.message === 'string' ? summary.message : '';
          const nextMessage = toConsoleSummaryMessage(message);

          if (nextMessage !== summary.message) {
            cursor.update({ ...summary, message: nextMessage });
          }

          cursor.continue();
        };
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB open request was blocked.'));
  });

const runNamedStoreTransaction = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await openConsoleLogDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const runConsoleLogWriteTransaction = async (callback: (stores: IConsoleLogWriteStores) => void): Promise<void> => {
  const db = await openConsoleLogDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME, SUMMARY_STORE_NAME], 'readwrite');
    callback({
      logStore: transaction.objectStore(STORE_NAME),
      summaryStore: transaction.objectStore(SUMMARY_STORE_NAME),
    });

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      scheduleConsoleLogsCleanup();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      scheduleConsoleLogsCleanup();
      reject(transaction.error);
    };
  });
};

interface IConsoleLogWriteStores {
  logStore: IDBObjectStore;
  summaryStore: IDBObjectStore;
}

const toConsoleLogSummary = (entry: IConsoleLogEntry): IConsoleLogSummary => ({
  logId: entry.logId,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
  level: entry.level,
  message: toConsoleSummaryMessage(entry.message),
  environment: entry.environment,
  href: entry.runtime?.href,
});

const putConsoleLog = (entry: IConsoleLogEntry) =>
  runConsoleLogWriteTransaction(({ logStore, summaryStore }) => {
    logStore.put(entry);
    summaryStore.put(toConsoleLogSummary(entry));
  });

const getAllConsoleLogs = (): Promise<IConsoleLogEntry[]> =>
  runNamedStoreTransaction(STORE_NAME, 'readonly', (store) => store.getAll());

const isExpiredConsoleLog = (createdAt: string) => {
  const createdAtMs = getDebugLogTimeMs(createdAt);

  return createdAtMs === undefined || Date.now() - createdAtMs > CONSOLE_LOG_TTL_MS;
};

const getExpiredConsoleLogCreatedAtUpperBound = () =>
  getDebugLogKstISOString(new Date(Date.now() - CONSOLE_LOG_TTL_MS));

const toConsoleMessagePart = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;

  try {
    return JSON.stringify(toDebugLogSafeValue(value));
  } catch {
    return String(value);
  }
};

const toConsoleMessage = (args: unknown[]) => {
  const message = args.map(toConsoleMessagePart).join(' ');
  return message || '(empty)';
};

const getConsoleLogStack = () => {
  const stack = new Error().stack;
  if (!stack) return undefined;

  return stack
    .split('\n')
    .slice(1)
    .filter(
      (line) => !line.includes('consoleLogStorage') && !line.includes('debugLogCommon') && !line.includes('logger.ts'),
    )
    .join('\n');
};

export const recordConsoleLog = async (level: ConsoleLogLevel, args: unknown[]) => {
  if (!isDebugLogEnabled()) return;

  await runDebugLogSafely(async () => {
    const now = getDebugLogKstISOString();
    const entry: IConsoleLogEntry = {
      logId: createConsoleLogId(),
      createdAt: now,
      updatedAt: now,
      level,
      message: toConsoleMessage(args),
      args: args.map((arg) => toDebugLogSafeValue(arg)),
      stack: getConsoleLogStack(),
      environment: env.currentEnvironment,
      runtime: getDebugLogRuntimeInfo(),
    };

    await putConsoleLog(entry);
    scheduleConsoleLogsCleanup();
  });
};

export const getConsoleLog = async (logId: string): Promise<IConsoleLogEntry | undefined> => {
  const log = await runNamedStoreTransaction<IConsoleLogEntry | undefined>(STORE_NAME, 'readonly', (store) =>
    store.get(logId),
  );
  if (!log) return undefined;
  if (!isExpiredConsoleLog(log.createdAt)) return log;

  await deleteConsoleLog(logId);
  return undefined;
};

export const listConsoleLogs = async (options: IConsoleLogListOptions = {}): Promise<IConsoleLogEntry[]> => {
  const { level, limit, textIncludes } = options;
  const query = textIncludes?.toLowerCase();

  const logs = await getAllConsoleLogs();
  scheduleConsoleLogsCleanup();

  const filteredLogs = logs
    .filter((log) => !isExpiredConsoleLog(log.createdAt))
    .filter((log) => (level ? log.level === level : true))
    .filter((log) =>
      query
        ? [log.logId, log.level, log.message, log.environment, log.runtime?.href]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true,
    )
    .sort(compareDebugLogCreatedAtDesc);

  return typeof limit === 'number' ? filteredLogs.slice(0, limit) : filteredLogs;
};

const matchesConsoleSearchText = (values: unknown[], query?: string) => {
  if (!query) return true;

  return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
};

const getConsoleLogSummarySearchValues = (log: IConsoleLogSummary) => [
  log.logId,
  log.level,
  log.message,
  log.environment,
  log.href,
];

const getConsoleLogEntrySearchValues = (log: IConsoleLogEntry) => [
  log.logId,
  log.level,
  log.message,
  log.environment,
  log.runtime?.href,
];

const matchesConsoleLogSummarySearchText = (log: IConsoleLogSummary, query?: string) =>
  matchesConsoleSearchText(getConsoleLogSummarySearchValues(log), query);

const matchesConsoleLogEntrySearchText = (log: IConsoleLogEntry, query?: string) =>
  matchesConsoleSearchText(getConsoleLogEntrySearchValues(log), query);

const toConsoleLogPageCursor = (log?: IConsoleLogSummary): IConsoleLogPageCursor | undefined =>
  log ? { logId: log.logId, createdAt: log.createdAt } : undefined;

export const listConsoleLogSummaryPage = async (
  options: IConsoleLogSummaryPageOptions = {},
): Promise<IConsoleLogSummaryPage> => {
  const { cursor, level, limit = 50, textIncludes } = options;
  const pageLimit = Math.max(1, limit);
  const query = textIncludes?.toLowerCase();

  const db = await openConsoleLogDB();

  return new Promise((resolve, reject) => {
    const items: IConsoleLogSummary[] = [];
    let cursorReached = !cursor;
    let hasMore = false;

    const transaction = db.transaction(query ? [SUMMARY_STORE_NAME, STORE_NAME] : [SUMMARY_STORE_NAME], 'readonly');
    const summaryStore = transaction.objectStore(SUMMARY_STORE_NAME);
    const logStore = query ? transaction.objectStore(STORE_NAME) : undefined;
    const cursorRequest = summaryStore.index('createdAt').openCursor(null, 'prev');

    const pushSummary = (summary: IConsoleLogSummary, currentCursor: IDBCursorWithValue) => {
      if (items.length >= pageLimit) {
        hasMore = true;
        return;
      }

      items.push(summary);
      currentCursor.continue();
    };

    cursorRequest.onsuccess = () => {
      const currentCursor = cursorRequest.result;
      if (!currentCursor) return;

      const summary = currentCursor.value as IConsoleLogSummary;
      if (!cursorReached) {
        if (summary.createdAt === cursor?.createdAt && summary.logId === cursor.logId) {
          cursorReached = true;
        }
        currentCursor.continue();
        return;
      }

      if (isExpiredConsoleLog(summary.createdAt) || (level && summary.level !== level)) {
        currentCursor.continue();
        return;
      }

      if (matchesConsoleLogSummarySearchText(summary, query)) {
        pushSummary(summary, currentCursor);
        return;
      }

      if (!query || !logStore) {
        currentCursor.continue();
        return;
      }

      const logRequest = logStore.get(summary.logId);
      logRequest.onsuccess = () => {
        const log = logRequest.result as IConsoleLogEntry | undefined;
        if (log && matchesConsoleLogEntrySearchText(log, query)) {
          pushSummary(summary, currentCursor);
          return;
        }

        currentCursor.continue();
      };
      logRequest.onerror = () => {
        currentCursor.continue();
      };
    };

    transaction.oncomplete = () => {
      db.close();
      scheduleConsoleLogsCleanup();
      resolve({
        items,
        nextCursor: toConsoleLogPageCursor(items[items.length - 1]),
        hasMore,
      });
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const deleteConsoleLog = (logId: string): Promise<void> =>
  runConsoleLogWriteTransaction(({ logStore, summaryStore }) => {
    logStore.delete(logId);
    summaryStore.delete(logId);
  });

export const clearConsoleLogs = (): Promise<void> =>
  runConsoleLogWriteTransaction(({ logStore, summaryStore }) => {
    logStore.clear();
    summaryStore.clear();
  });

const cleanupConsoleLogs = async (): Promise<boolean> => {
  const db = await openConsoleLogDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME, SUMMARY_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const summaryStore = transaction.objectStore(SUMMARY_STORE_NAME);
    const cursorRequest = summaryStore
      .index('createdAt')
      .openCursor(IDBKeyRange.upperBound(getExpiredConsoleLogCreatedAtUpperBound(), true));
    let deletedCount = 0;
    let hasMoreExpiredLogs = false;

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;

      store.delete(cursor.primaryKey);
      cursor.delete();
      deletedCount += 1;

      if (deletedCount >= DEBUG_LOG_CLEANUP_BATCH_SIZE) {
        hasMoreExpiredLogs = true;
        return;
      }

      cursor.continue();
    };

    transaction.oncomplete = () => {
      db.close();
      resolve(hasMoreExpiredLogs);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const cleanupConsoleLogsIfNeeded = (force = false): Promise<void> => {
  if (!isDebugLogEnvironment() || !isDebugLogClient()) {
    return Promise.resolve();
  }
  if (cleanupPromise) {
    return cleanupPromise;
  }
  if (!force && Date.now() - lastCleanupAtMs < DEBUG_LOG_CLEANUP_INTERVAL_MS) {
    return Promise.resolve();
  }

  cleanupPromise = cleanupConsoleLogs()
    .then((hasMoreExpiredLogs) => {
      lastCleanupAtMs = Date.now();
      if (hasMoreExpiredLogs) {
        scheduleConsoleLogsCleanup(true);
      }
    })
    .finally(() => {
      cleanupPromise = null;
    });

  return cleanupPromise;
};

const scheduleConsoleLogsCleanup = (force = false) => {
  scheduledCleanupForce = scheduledCleanupForce || force;

  if (cleanupTimerId) return;

  cleanupTimerId = setTimeout(() => {
    const shouldForce = scheduledCleanupForce;

    cleanupTimerId = undefined;
    scheduledCleanupForce = false;
    void runDebugLogSafely(() => cleanupConsoleLogsIfNeeded(shouldForce));
  }, DEBUG_LOG_CLEANUP_SCHEDULE_DELAY_MS);
};

const installConsoleLogTools = () => {
  if (typeof window === 'undefined') return;
  if (!isDebugLogEnvironment()) return;

  scheduleConsoleLogsCleanup(true);

  const windows = window as Window & {
    __smartCsLog?: {
      isEnabled?: typeof isDebugLogEnabled;
      console?: {
        list: typeof listConsoleLogs;
        get: typeof getConsoleLog;
        remove: typeof deleteConsoleLog;
        clear: typeof clearConsoleLogs;
        export: () => Promise<string>;
      };
    };
  };

  windows.__smartCsLog = {
    ...windows.__smartCsLog,
    isEnabled: isDebugLogEnabled,
    console: {
      list: listConsoleLogs,
      get: getConsoleLog,
      remove: deleteConsoleLog,
      clear: clearConsoleLogs,
      export: async () => JSON.stringify(await listConsoleLogs(), null, 2),
    },
  };
};

installConsoleLogTools();
