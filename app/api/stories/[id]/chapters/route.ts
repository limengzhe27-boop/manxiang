/**
 * POST /api/stories/:id/chapters
 *
 * 生成 story 的下一话
 * 入参可选: { choice?: { emotion, text } }
 *
 * 返回: { chapter: StoredChapter }
 *
 * 流程:
 *   1. 政要名字检测 -> 拒绝
 *   2. 拼装提示词 (首话 vs 续写, 续写注入已有 characters)
 *   3. DeepSeek 生成章节 JSON
 *   4. 首话: 抽出 characters 入 store
 *      续写: characters_new 追加到 store
 *   5. 章节先存, 立即返回前端
 *   6. 后台并行生成 2 张图 (传入 story 完整 characters)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateChapter, type CharacterProfile } from '@/lib/deepseek';
import { generateImages } from '@/lib/siliconflow';
import {
  SYSTEM_PROMPT_FIRST,
  SYSTEM_PROMPT_NEXT,
  buildFirstChapterUserMsg,
  buildNextChapterUserMsg
} from '@/lib/prompts';
import {
  getStory,
  appendChapter,
  recordChoice,
  updatePanelImage,
  addCharacters,
  getCharacters
} from '@/lib/store';
import { detectPoliticalFigure, buildSafetyMessage } from '@/lib/safety';
import { getOrCreateUserByDevice, consumeQuota, CREDITS_PER_CHAPTER } from '@/lib/user-store';
import { storeImageFromUrl } from '@/lib/image-store';
import { checkGenerateLimit, clientIp } from '@/lib/rate-limit';
import { waitUntil } from '@vercel/functions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel Pro/Enterprise 可达 60s/900s, Hobby 上限 10s (装着不会出错, 只是不会超过上限)
export const maxDuration = 60;

type Body = { choice?: { emotion: string; text: string } };

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const story = await getStory(params.id);
  if (!story) {
    return NextResponse.json({ error: '故事不存在或已过期' }, { status: 404 });
  }

  // L1 堵洞: 生成必须带身份, 否则拒绝 (杜绝"不带 deviceId 绕过额度")
  const deviceId = deviceIdOf(req);
  if (!deviceId) {
    return NextResponse.json({ error: '缺少身份标识，请刷新页面后重试' }, { status: 401 });
  }

  // L2/L3 IP 限流 + 全局熔断 (在烧 AI 钱之前先挡)
  const limit = await checkGenerateLimit(clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason, code: 'RATE_LIMITED', retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  // 每日额度检查
  const user = await getOrCreateUserByDevice(deviceId);
  const quotaUserId = user.id;
  const canFree = user.credits.freeUsedToday < user.credits.freeDailyLimit;
  const canCredits = user.credits.bonusCredits >= CREDITS_PER_CHAPTER;
  if (!canFree && !canCredits) {
    return NextResponse.json(
      {
        error: '今日额度已用完',
        code: 'QUOTA_EXCEEDED',
        quota: {
          remainingFree: 0,
          dailyLimit: user.credits.freeDailyLimit,
          bonusCredits: user.credits.bonusCredits
        }
      },
      { status: 402 }
    );
  }

  // 1. 真实人物 / 版权角色拦截
  const hitInSeed = detectPoliticalFigure(story.seed);
  if (hitInSeed) {
    return NextResponse.json({ error: buildSafetyMessage(hitInSeed) }, { status: 400 });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // 允许空 body
  }

  const nextNo = story.chapters.length + 1;
  if (nextNo > 1 && body.choice) {
    await recordChoice(story.id, nextNo - 1, body.choice);
  }

  // 2. 选 system prompt + 拼 user msg
  const isFirst = nextNo === 1;
  const systemPrompt = isFirst ? SYSTEM_PROMPT_FIRST : SYSTEM_PROMPT_NEXT;
  const userMsg = isFirst
    ? buildFirstChapterUserMsg(story.seed)
    : buildNextChapterUserMsg({
        seed: story.seed,
        chapterNo: nextNo,
        prevSummaries: story.summaries,
        prevChoice: body.choice ?? { emotion: '深入', text: '继续按当前方向推进' },
        characters: await getCharacters(story.id)
      });

  try {
    const chapter = await generateChapter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg }
    ]);

    if (
      !chapter ||
      typeof chapter.title !== 'string' ||
      typeof chapter.text !== 'string' ||
      !Array.isArray(chapter.panels) ||
      chapter.panels.length !== 2 ||
      !Array.isArray(chapter.choices) ||
      chapter.choices.length !== 3
    ) {
      return NextResponse.json({ error: 'AI 返回结构不符合规范，请重试' }, { status: 502 });
    }

    // 3. 政要拦截 (复查 LLM 出的角色名字)
    const newChars: CharacterProfile[] = [
      ...(chapter.characters ?? []),
      ...(chapter.characters_new ?? [])
    ];
    for (const c of newChars) {
      const hit = detectPoliticalFigure(c.name) || detectPoliticalFigure(c.appearance);
      if (hit) {
        return NextResponse.json({ error: buildSafetyMessage(hit) }, { status: 400 });
      }
    }

    // 4. 角色入库 (会自动生成 seed)
    if (newChars.length > 0) {
      await addCharacters(story.id, newChars);
      console.log(
        `[chapters] story ${story.id} 新增角色:`,
        newChars.map((c) => `${c.name}(${c.gender})`).join(', ')
      );
    }

    // 5. 章节先存 (imageUrl 全 null)
    const chapterWithNullImages = {
      ...chapter,
      panels: chapter.panels.map((p) => ({ ...p, imageUrl: null }))
    };
    const stored = await appendChapter(story.id, chapterWithNullImages);
    if (!stored) {
      return NextResponse.json({ error: '故事已被清除' }, { status: 404 });
    }

    // 6. 拿到 story 完整 characters (含 seed) 后台异步生成图
    //    把 panel.caption (中文动作描述) 也合并进 prompt 增强细节匹配度
    const allCharacters = await getCharacters(story.id);
    const prompts = chapter.panels.map((p) => {
      // caption 是中文, 模型理解度有限, 但加上有助于"提示动作主体"
      const captionHint = p.caption ? ` Key moment: ${p.caption}.` : '';
      return p.prompt + captionHint;
    });
    const chapterNo = stored.no;
    // 用 waitUntil 包裹后台任务: 在 Vercel serverless 上,
    // 不这么做的话, 函数 return 后实例会被立即回收, 后台 .then 不会执行 (图永远不出现)
    waitUntil(
      (async () => {
        try {
          const urls = await generateImages(prompts, allCharacters);
          // 把临时 URL 转存为永久 URL (避免 1 小时过期), 转存失败则退回临时 URL
          const permanent = await Promise.all(
            urls.map(async (url) => {
              if (!url) return null;
              const saved = await storeImageFromUrl(url);
              return saved ?? url;
            })
          );
          await Promise.all(
            permanent.map((url, i) => updatePanelImage(story.id, chapterNo, i, url))
          );
          console.log(
            `[chapters] story ${story.id} ch ${chapterNo} 图像就绪(已转存): ${permanent.filter(Boolean).length}/2`
          );
        } catch (err) {
          console.error('[chapters] 图像生成失败 (整批):', err);
        }
      })()
    );

    // 7. 生成成功, 扣额度
    const r = await consumeQuota(quotaUserId);
    const dailyLimit = user.credits.freeDailyLimit;
    const quota = r.allowed
      ? { remainingFree: r.remainingFree, dailyLimit, bonusCredits: r.bonusCredits, via: r.via }
      : { remainingFree: 0, dailyLimit, bonusCredits: r.bonusCredits };

    return NextResponse.json({ chapter: stored, quota });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[stories/chapters] failed:', msg);
    return NextResponse.json({ error: '生成失败：' + msg }, { status: 500 });
  }
}
