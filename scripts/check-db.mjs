#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const envPath = resolve(process.cwd(), '.env.local');
const envText = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}

const sql = neon(env.DATABASE_URL);
const now = Date.now();
const id = `db_check_${now}`;
const story = {
  id,
  seed: 'db connectivity check',
  source: 'prompt',
  chapters: [],
  summaries: [],
  characters: [],
  createdAt: now,
  updatedAt: now
};

await sql`
  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    seed TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('seed', 'prompt')),
    data JSONB NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )
`;

await sql`
  INSERT INTO stories (id, seed, source, data, created_at, updated_at)
  VALUES (${story.id}, ${story.seed}, ${story.source}, ${JSON.stringify(story)}, ${story.createdAt}, ${story.updatedAt})
`;

const rows = await sql`
  SELECT id, data
  FROM stories
  WHERE id = ${id}
  LIMIT 1
`;

if (rows[0]?.data?.id !== id) {
  throw new Error('Inserted story could not be read back');
}

await sql`DELETE FROM stories WHERE id = ${id}`;

console.log(`ok ${id}`);
