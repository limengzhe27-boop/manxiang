/**
 * 服务端 Story 存储
 * 当前使用 Neon PostgreSQL 持久化，data 字段保存完整 story JSON。
 *
 * ⚠️ 仅在服务端使用，禁止在 'use client' 中 import
 */

import type { GeneratedChapter, CharacterProfile } from './deepseek';
import { ensureDb, sql } from './db';

export type StoredChapter = GeneratedChapter & {
  no: number;
  /** 用户在这一话之后选择的剧情走向 */
  chosen?: { emotion: string; text: string };
};

export type StoredStory = {
  id: string;
  /** 创建该故事的用户 id (app_users.id); 匿名早期数据可能为空 */
  userId?: string | null;
  /** 用户可编辑标题；为空时用首话标题或种子摘要兜底 */
  title?: string;
  /** 故事种子的原始文本（来自种子库 desc 或用户自由输入的 prompt）*/
  seed: string;
  /** 故事来源类型，仅用于统计 */
  source: 'seed' | 'prompt';
  chapters: StoredChapter[];
  /** 滚动摘要 与 chapters 对齐，第 i 个摘要是 chapters[i].summary */
  summaries: string[];
  /** 故事中所有角色的档案 首话生成时建立 后续话可追加 */
  characters: CharacterProfile[];
  createdAt: number;
  updatedAt: number;
};

type StoryRow = {
  data: StoredStory;
  title?: string | null;
};

function genId() {
  // st_<时间戳后6位>_<6位随机base36>
  const t = Date.now().toString(36).slice(-6);
  const r = Math.random().toString(36).slice(2, 8);
  return `st_${t}${r}`;
}

function cloneStory(story: StoredStory): StoredStory {
  return JSON.parse(JSON.stringify(story)) as StoredStory;
}

function cloneChapter(chapter: StoredChapter): StoredChapter {
  return JSON.parse(JSON.stringify(chapter)) as StoredChapter;
}

async function saveStory(story: StoredStory) {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await ensureDb();
  await sql`
    INSERT INTO stories (id, user_id, seed, source, title, status, visibility, data, created_at, updated_at)
    VALUES (
      ${story.id},
      ${story.userId ?? null},
      ${story.seed},
      ${story.source},
      ${story.title ?? story.chapters[0]?.title ?? null},
      ${story.chapters.length >= 15 ? 'finished' : 'ongoing'},
      ${'private'},
      ${JSON.stringify(story)},
      ${story.createdAt},
      ${story.updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      seed = EXCLUDED.seed,
      source = EXCLUDED.source,
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      visibility = EXCLUDED.visibility,
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function createStory(
  seed: string,
  source: 'seed' | 'prompt',
  userId?: string | null
): Promise<StoredStory> {
  const now = Date.now();
  const story: StoredStory = {
    id: genId(),
    userId: userId ?? null,
    seed,
    source,
    chapters: [],
    summaries: [],
    characters: [],
    createdAt: now,
    updatedAt: now
  };
  await saveStory(story);
  return cloneStory(story);
}

export async function getStory(id: string): Promise<StoredStory | null> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await ensureDb();
  const rows = (await sql`
    SELECT data, title
    FROM stories
    WHERE id = ${id}
    LIMIT 1
  `) as StoryRow[];
  if (!rows[0]?.data) return null;
  const story = cloneStory(rows[0].data);
  if (rows[0].title) story.title = rows[0].title;
  return story;
}

/** 列出某用户的故事; 不传 userId 时返回空 (避免泄漏全平台) */
export async function listStories(userId?: string | null): Promise<StoredStory[]> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await ensureDb();
  if (!userId) return [];
  const rows = (await sql`
    SELECT data, title
    FROM stories
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT 100
  `) as StoryRow[];
  return rows.map((row) => {
    const story = cloneStory(row.data);
    if (row.title) story.title = row.title;
    return story;
  });
}

export async function updateStoryTitle(id: string, title: string): Promise<StoredStory | null> {
  const story = await getStory(id);
  if (!story) return null;
  story.title = title;
  story.updatedAt = Date.now();
  await saveStory(story);
  return cloneStory(story);
}

/** 删除故事; 传 ownerUserId 时只删属于该用户的 (防止删他人作品) */
export async function deleteStory(id: string, ownerUserId?: string | null): Promise<boolean> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await ensureDb();
  const rows = ownerUserId
    ? ((await sql`
        DELETE FROM stories WHERE id = ${id} AND user_id = ${ownerUserId} RETURNING id
      `) as Array<{ id: string }>)
    : ((await sql`
        DELETE FROM stories WHERE id = ${id} RETURNING id
      `) as Array<{ id: string }>);
  return rows.length > 0;
}

export async function appendChapter(
  id: string,
  chapter: GeneratedChapter
): Promise<StoredChapter | null> {
  const story = await getStory(id);
  if (!story) return null;

  const stored: StoredChapter = { ...chapter, no: story.chapters.length + 1 };
  story.chapters.push(stored);
  if (chapter.summary) story.summaries.push(chapter.summary);
  story.updatedAt = Date.now();
  await saveStory(story);
  return cloneChapter(stored);
}

/** 设置某一话某一格的图像 URL (异步图像生成回调用) */
export async function updatePanelImage(
  id: string,
  chapterNo: number,
  panelIndex: number,
  imageUrl: string | null
) {
  const story = await getStory(id);
  if (!story) return false;
  const ch = story.chapters.find((c) => c.no === chapterNo);
  if (!ch) return false;
  if (!ch.panels[panelIndex]) return false;
  ch.panels[panelIndex].imageUrl = imageUrl;
  story.updatedAt = Date.now();
  await saveStory(story);
  return true;
}

/** 追加角色档案 名字已存在则不重复加 */
export async function addCharacters(id: string, chars: CharacterProfile[]) {
  const story = await getStory(id);
  if (!story) return;
  const existingNames = new Set(story.characters.map((c) => c.name));
  chars.forEach((c) => {
    if (!c.name || existingNames.has(c.name)) return;
    // 给每个新角色生成固定 seed (1 ~ 2^31-1)
    if (c.seed === undefined) c.seed = Math.floor(Math.random() * 2_000_000_000) + 1;
    story.characters.push(c);
    existingNames.add(c.name);
  });
  story.updatedAt = Date.now();
  await saveStory(story);
}

export async function getCharacters(id: string): Promise<CharacterProfile[]> {
  const story = await getStory(id);
  return story?.characters ?? [];
}

/** 记下用户在某一话上的选择 */
export async function recordChoice(
  id: string,
  chapterNo: number,
  choice: { emotion: string; text: string }
) {
  const story = await getStory(id);
  if (!story) return false;
  const ch = story.chapters.find((c) => c.no === chapterNo);
  if (!ch) return false;
  ch.chosen = choice;
  story.updatedAt = Date.now();
  await saveStory(story);
  return true;
}

/** 当前服务端记录的故事数（仅供调试） */
export async function storyCount() {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await ensureDb();
  const rows = (await sql`SELECT COUNT(*)::int AS count FROM stories`) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}
