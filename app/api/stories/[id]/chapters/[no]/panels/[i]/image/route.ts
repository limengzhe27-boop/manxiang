/**
 * POST /api/stories/:id/chapters/:no/panels/:i/image
 *
 * 生成单张分镜图 (Vercel Hobby 10s 限制下的拆分方案):
 *   chapters 路由只生成文字, 不触发图片;
 *   前端拿到章节后, 对每张 panel 单独调本接口, 每个请求只跑 1 张图 + 转存.
 *
 * 防刷:
 *   - 必须带 deviceId
 *   - 必须是 story 的归属者
 *   - 同接口 IP 限流: 每分钟 10 次 (两张图并发, 加重试余量)
 *
 * 幂等性:
 *   - 如果该 panel.imageUrl 已存在(已生成过), 直接返回, 不重复生成
 *   - 失败再调 = 重试
 */

import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { getStory, updatePanelImage, getCharacters } from '@/lib/store';
import { generateImage } from '@/lib/siliconflow';
import { storeImageFromUrl } from '@/lib/image-store';
import { getOrCreateUserByDevice } from '@/lib/user-store';
import { sql } from '@/lib/db';
import { clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Pro/Enterprise; Hobby 实际上限 10s

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; no: string; i: string } }
) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少身份' }, { status: 401 });

  const chapterNo = parseInt(params.no, 10);
  const panelIndex = parseInt(params.i, 10);
  if (!Number.isFinite(chapterNo) || !Number.isFinite(panelIndex)) {
    return NextResponse.json({ error: '路径参数非法' }, { status: 400 });
  }

  // 单图接口的 IP 限流: 同 IP 每分钟最多 10 次 (并发 2 + 重试余量)
  if (sql) {
    const ipKey = `ip:${clientIp(req)}:img:min`;
    const now = Date.now();
    const ws = Math.floor(now / 60_000) * 60_000;
    const rl = (await sql`
      INSERT INTO rate_limits (bucket, count, window_start, updated_at)
      VALUES (${ipKey}, 1, ${ws}, ${now})
      ON CONFLICT (bucket) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start = ${ws} THEN rate_limits.count + 1 ELSE 1 END,
        window_start = ${ws}, updated_at = ${now}
      RETURNING count
    `) as Array<{ count: number }>;
    if (rl[0].count > 10) {
      return NextResponse.json(
        { error: '图片请求太频繁，请稍后再试', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }
  }

  const story = await getStory(params.id);
  if (!story) return NextResponse.json({ error: '故事不存在' }, { status: 404 });

  // 校验归属 (无 user_id 的老数据放行)
  if (story.userId) {
    const user = await getOrCreateUserByDevice(deviceId);
    if (user.id !== story.userId) {
      return NextResponse.json({ error: '无权访问该故事' }, { status: 403 });
    }
  }

  const chapter = story.chapters.find((c) => c.no === chapterNo);
  if (!chapter) return NextResponse.json({ error: '章节不存在' }, { status: 404 });

  const panel = chapter.panels[panelIndex];
  if (!panel) return NextResponse.json({ error: '分镜不存在' }, { status: 404 });

  // 幂等: 已存在永久 URL (/api/img/) 直接返回; 临时 URL 或 null 才重新生成
  if (panel.imageUrl && panel.imageUrl.startsWith('/api/img/')) {
    return NextResponse.json({ ok: true, imageUrl: panel.imageUrl, cached: true });
  }

  try {
    const characters = await getCharacters(story.id);
    const captionHint = panel.caption ? ` Key moment: ${panel.caption}.` : '';
    const tempUrl = await generateImage(panel.prompt + captionHint, characters);

    // 转存: 同步等待 (不超时上限内能完成 ~1-2s)
    // 转存失败 fallback 到临时 URL (1 小时内还能用)
    let finalUrl: string;
    try {
      const saved = await storeImageFromUrl(tempUrl);
      finalUrl = saved ?? tempUrl;
    } catch (err) {
      console.error('[panel/image] 转存失败, 回退临时 URL:', err);
      finalUrl = tempUrl;
    }

    // 写库 (并发安全: store 里是 INSERT...ON CONFLICT UPDATE)
    await updatePanelImage(story.id, chapterNo, panelIndex, finalUrl);

    return NextResponse.json({ ok: true, imageUrl: finalUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[panel/image] 生成失败:', msg);
    return NextResponse.json({ error: '图片生成失败：' + msg }, { status: 500 });
  }
}
