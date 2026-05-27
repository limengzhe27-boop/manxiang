/**
 * POST /api/stories
 *
 * 入参：
 *   {
 *     seed?: string;     // 来自故事种子库的描述
 *     prompt?: string;   // 用户自由输入
 *   }  // 二选一
 *
 * 返回：
 *   { storyId: string, seedExcerpt: string }
 *
 * 不立即生成第一话, 让客户端跳到 /create?storyId=xxx 后再触发生成
 * 这样输入框不会卡住等待 10 秒
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStory, listStories } from '@/lib/store';
import { detectPoliticalFigure, buildSafetyMessage } from '@/lib/safety';
import { getOrCreateUserByDevice } from '@/lib/user-store';
import { checkCreateStoryLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { seed?: string; prompt?: string };

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function GET(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ stories: [] });
  try {
    const user = await getOrCreateUserByDevice(deviceId);
    const stories = await listStories(user.id);
    return NextResponse.json({ stories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/stories GET]', msg);
    return NextResponse.json({ error: '获取故事列表失败：' + msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }

  const promptText = (body.prompt ?? '').trim();
  const seedText = (body.seed ?? '').trim();
  const text = promptText || seedText;

  if (!text) return NextResponse.json({ error: '请输入故事想法或选择故事种子' }, { status: 400 });
  if (text.length > 200) return NextResponse.json({ error: '故事想法不能超过 200 字' }, { status: 400 });

  // 创建故事 IP 限流
  const limit = await checkCreateStoryLimit(clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason, code: 'RATE_LIMITED', retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  // 简单兜底敏感词
  const banned = /(色情|做爱|裸体|强奸|自杀|杀人|炸药)/;
  if (banned.test(text)) {
    return NextResponse.json({ error: '内容包含敏感词，请调整后再试' }, { status: 400 });
  }

  // 真实人物 / 版权角色拦截
  const polHit = detectPoliticalFigure(text);
  if (polHit) {
    return NextResponse.json({ error: buildSafetyMessage(polHit) }, { status: 400 });
  }

  // 归属到当前用户 (无 deviceId 时仍可创建, userId 为空)
  let userId: string | null = null;
  const deviceId = deviceIdOf(req);
  if (deviceId) {
    try {
      const user = await getOrCreateUserByDevice(deviceId);
      userId = user.id;
    } catch (err) {
      console.error('[api/stories POST] 解析用户失败', err);
    }
  }

  const story = await createStory(text, promptText ? 'prompt' : 'seed', userId);
  return NextResponse.json({
    storyId: story.id,
    seedExcerpt: text.length > 40 ? text.slice(0, 40) + '…' : text
  });
}
