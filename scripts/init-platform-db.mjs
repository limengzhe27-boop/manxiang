#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}

if (!env.DATABASE_URL) throw new Error('DATABASE_URL missing in .env.local');

const sql = neon(env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL DEFAULT '漫想者',
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,

  // 匿名设备 ID (无登录时的用户标识) + 头像字(单个汉字) + 偏好开关 JSONB + 会员到期时间
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS device_id TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_char TEXT NOT NULL DEFAULT '漫'`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS prefs JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS plan_expires_at BIGINT`,
  // 访问密码 (scrypt 哈希, 格式 scrypt$salt$hash); null = 未设密码(未激活)
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_device_id ON app_users(device_id)`,

  `CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    seed TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('seed', 'prompt')),
    title TEXT,
    status TEXT NOT NULL DEFAULT 'ongoing',
    visibility TEXT NOT NULL DEFAULT 'private',
    data JSONB NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,

  `ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL`,
  `ALTER TABLE stories ADD COLUMN IF NOT EXISTS title TEXT`,
  `ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ongoing'`,
  `ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'`,

  `CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    summary TEXT,
    chosen_emotion TEXT,
    chosen_text TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(story_id, chapter_no)
  )`,

  `CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT,
    appearance TEXT NOT NULL,
    seed INTEGER,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(story_id, name)
  )`,

  `CREATE TABLE IF NOT EXISTS panel_images (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_no INTEGER NOT NULL,
    panel_index INTEGER NOT NULL,
    beat TEXT,
    caption TEXT,
    excerpt TEXT,
    prompt TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(story_id, chapter_no, panel_index)
  )`,

  // 防刷: 限流计数 (按 bucket 维度的固定时间窗计数)
  //   bucket 形如  ip:1.2.3.4:gen:min  / ip:1.2.3.4:gen:day  / global:gen:day
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    window_start BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,

  // 分镜图永久存储 (转存自文生图临时 URL, 避免 1 小时过期)
  // 体验版用数据库存 base64; 正式运营应迁移到对象存储 (OSS / R2)
  `CREATE TABLE IF NOT EXISTS image_blobs (
    key TEXT PRIMARY KEY,
    content_type TEXT NOT NULL DEFAULT 'image/png',
    data_base64 TEXT NOT NULL,
    bytes INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS generation_events (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    story_id TEXT REFERENCES stories(id) ON DELETE SET NULL,
    chapter_no INTEGER,
    event_name TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    success BOOLEAN,
    duration_ms INTEGER,
    error TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS usage_credits (
    user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    free_daily_limit INTEGER NOT NULL DEFAULT 3,
    free_used_today INTEGER NOT NULL DEFAULT 0,
    bonus_credits INTEGER NOT NULL DEFAULT 0,
    reset_date TEXT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS published_stories (
    story_id TEXT PRIMARY KEY REFERENCES stories(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    publish_status TEXT NOT NULL DEFAULT 'draft',
    reading_mode TEXT NOT NULL DEFAULT 'free',
    price_credits INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    story_id TEXT REFERENCES stories(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS reading_orders (
    id TEXT PRIMARY KEY,
    reader_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    paid_credits INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS story_metrics (
    story_id TEXT PRIMARY KEY REFERENCES stories(id) ON DELETE CASCADE,
    views INTEGER NOT NULL DEFAULT 0,
    reads INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    exports INTEGER NOT NULL DEFAULT 0,
    continues INTEGER NOT NULL DEFAULT 0,
    updated_at BIGINT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories(updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id, chapter_no)`,
  `CREATE INDEX IF NOT EXISTS idx_characters_story_id ON characters(story_id)`,
  `CREATE INDEX IF NOT EXISTS idx_panels_story_chapter ON panel_images(story_id, chapter_no)`,
  `CREATE INDEX IF NOT EXISTS idx_generation_events_story ON generation_events(story_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_published_status ON published_stories(publish_status, featured)`,
  `CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_reading_orders_reader ON reading_orders(reader_user_id, created_at DESC)`
];

for (const statement of statements) {
  await sql.query(statement, []);
}

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`;

console.log('created/verified tables:');
for (const row of tables) console.log(`- ${row.table_name}`);
