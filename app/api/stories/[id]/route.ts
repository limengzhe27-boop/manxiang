/**
 * GET /api/stories/:id
 *
 * 返回 story 完整数据：seed、所有已生成章节、摘要、用户的历史选择
 * 客户端用它来恢复创作状态（刷新 / 跨设备 / 后续接数据库后真正恢复）
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteStory, getStory, updateStoryTitle } from '@/lib/store';
import { getOrCreateUserByDevice } from '@/lib/user-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const story = await getStory(params.id);
  if (!story) {
    return NextResponse.json({ error: '故事不存在或已过期' }, { status: 404 });
  }

  // 兼容: 旧故事可能存了 4 张 panel (老版本), 返回前裁到 2 张 (后 2 张 ≈ CLIMAX + HOOK)
  const chaptersTrimmed = story.chapters.map((ch) => {
    if (ch.panels.length <= 2) return ch;
    return { ...ch, panels: ch.panels.slice(-2) };
  });

  return NextResponse.json({
    id: story.id,
    title: story.title,
    seed: story.seed,
    source: story.source,
    chapters: chaptersTrimmed,
    summaries: story.summaries,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: { title?: string };
  try {
    body = (await req.json()) as { title?: string };
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }

  const title = (body.title ?? '').trim();
  if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
  if (title.length > 30) return NextResponse.json({ error: '标题不能超过 30 字' }, { status: 400 });

  const story = await updateStoryTitle(params.id, title);
  if (!story) return NextResponse.json({ error: '故事不存在或已过期' }, { status: 404 });
  return NextResponse.json({ story });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const deviceId = deviceIdOf(req);
  let ownerUserId: string | null = null;
  if (deviceId) {
    try {
      const user = await getOrCreateUserByDevice(deviceId);
      ownerUserId = user.id;
    } catch {
      /* 忽略, 走无归属删除会被下面拦截 */
    }
  }
  if (!ownerUserId) {
    return NextResponse.json({ error: '缺少身份，无法删除' }, { status: 400 });
  }
  const ok = await deleteStory(params.id, ownerUserId);
  if (!ok) return NextResponse.json({ error: '故事不存在或无权删除' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
