export type MessageRole = 'user' | 'assistant' | 'system';

export interface Conversation {
  id: string;
  title: string;
  personaId: string;
  modelId: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  personaId: string;
  modelId: string;
  timestamp: number;
  tokens: number;
  streaming: boolean;
  error: number;
  errorMessage?: string;
}

export interface ApiConfig {
  key: string;
  value: string;
  updatedAt: number;
}

export interface UsageRecord {
  date: string;
  tokens: number;
  requests: number;
  conversations: number;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  color: string;
  sampleQuestions: string[];
  greeting: string;
}

export type TableName =
  | 'conversations'
  | 'messages'
  | 'api_configs'
  | 'usage'
  | 'knowledge'
  | 'personas';

interface StoreConfig {
  keyPath: string;
  indexes: { name: string; unique?: boolean }[];
}

const STORE_CONFIGS: Record<TableName, StoreConfig> = {
  conversations: {
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt' },
      { name: 'pinned' },
      { name: 'personaId' },
      { name: 'modelId' },
      { name: 'title' },
      { name: 'createdAt' },
    ],
  },
  messages: {
    keyPath: 'id',
    indexes: [
      { name: 'conversationId' },
      { name: 'timestamp' },
      { name: 'role' },
    ],
  },
  api_configs: {
    keyPath: 'key',
    indexes: [],
  },
  usage: {
    keyPath: 'date',
    indexes: [],
  },
  knowledge: {
    keyPath: 'id',
    indexes: [
      { name: 'category' },
      { name: 'createdAt' },
      { name: 'updatedAt' },
    ],
  },
  personas: {
    keyPath: 'id',
    indexes: [],
  },
};

const DB_NAME = 'datamind_db';
const DB_VERSION = 1;

let cachedDb: IDBDatabase | null = null;
let openPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (openPromise) return openPromise;
  if (cachedDb) {
    openPromise = Promise.resolve(cachedDb);
    return openPromise;
  }
  openPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      (Object.keys(STORE_CONFIGS) as TableName[]).forEach((table) => {
        const config = STORE_CONFIGS[table];
        if (!db.objectStoreNames.contains(table)) {
          const store = db.createObjectStore(table, { keyPath: config.keyPath });
          config.indexes.forEach((idx) => {
            store.createIndex(idx.name, idx.name, { unique: idx.unique ?? false });
          });
        }
      });
    };
    request.onsuccess = (event) => {
      cachedDb = (event.target as IDBOpenDBRequest).result;
      cachedDb.onclose = () => {
        cachedDb = null;
        openPromise = null;
      };
      cachedDb.onversionchange = () => {
        cachedDb?.close();
        cachedDb = null;
        openPromise = null;
      };
      resolve(cachedDb);
    };
    request.onerror = (event) => {
      openPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
    request.onblocked = () => {
      openPromise = null;
      reject(new Error('IndexedDB open blocked'));
    };
  });
  return openPromise;
}

function withTransaction<T>(
  table: TableName,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(table, mode);
        const store = transaction.objectStore(table);
        const request = executor(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
        transaction.onabort = (event) => reject((event.target as IDBTransaction).error);
      })
  );
}

export async function getAll<T>(table: TableName): Promise<T[]> {
  return withTransaction<T[]>(table, 'readonly', (store) => store.getAll());
}

export async function get<T>(table: TableName, key: IDBValidKey): Promise<T | undefined> {
  const result = await withTransaction<T | undefined>(table, 'readonly', (store) => store.get(key));
  return result;
}

export async function add<T>(table: TableName, value: T): Promise<IDBValidKey> {
  return withTransaction<IDBValidKey>(table, 'readwrite', (store) => store.add(value));
}

export async function put<T>(table: TableName, value: T): Promise<IDBValidKey> {
  return withTransaction<IDBValidKey>(table, 'readwrite', (store) => store.put(value));
}

export async function remove(table: TableName, key: IDBValidKey): Promise<void> {
  await withTransaction<undefined>(table, 'readwrite', (store) => store.delete(key));
}

export async function clear(table: TableName): Promise<void> {
  await withTransaction<undefined>(table, 'readwrite', (store) => store.clear());
}

export async function getAllByIndex<T>(
  table: TableName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  return withTransaction<T[]>(table, 'readonly', (store) =>
    store.index(indexName).getAll(IDBKeyRange.only(value))
  );
}

export async function getAllByIndexRange<T>(
  table: TableName,
  indexName: string,
  lower: IDBValidKey,
  upper?: IDBValidKey
): Promise<T[]> {
  return withTransaction<T[]>(table, 'readonly', (store) => {
    const range =
      upper !== undefined ? IDBKeyRange.bound(lower, upper) : IDBKeyRange.lowerBound(lower);
    return store.index(indexName).getAll(range);
  });
}

export async function clearAll(): Promise<void> {
  const tables: TableName[] = [
    'conversations',
    'messages',
    'api_configs',
    'usage',
    'knowledge',
    'personas',
  ];
  for (const table of tables) {
    await clear(table);
  }
}

export function closeDatabase(): void {
  if (cachedDb) {
    cachedDb.close();
    cachedDb = null;
    openPromise = null;
  }
}

export const database = {
  open: openDatabase,
  getAll,
  get,
  add,
  put,
  delete: remove,
  clear,
  getAllByIndex,
  getAllByIndexRange,
  clearAll,
  close: closeDatabase,
};

export default database;
