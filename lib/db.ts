import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('[db] DATABASE_URL 未配置，将无法使用 Neon 持久化存储');
}

export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

let initPromise: Promise<void> | null = null;

export async function ensureDb() {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  if (!initPromise) {
    initPromise = sql`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        seed TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('seed', 'prompt')),
        title TEXT,
        status TEXT NOT NULL DEFAULT 'ongoing',
        visibility TEXT NOT NULL DEFAULT 'private',
        data JSONB NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `.then(() => undefined);
  }
  return initPromise;
}
