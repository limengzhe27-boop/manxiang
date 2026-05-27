/**
 * 防刷限流 (基于 Neon, 固定时间窗计数)
 *
 * 仅服务端使用。
 * bucket 命名: ip:{ip}:{action}:min / ip:{ip}:{action}:day / global:{action}:day
 *
 * 窗口策略: 固定窗 (分钟窗 / 自然天窗)。简单可靠, 对体验版足够。
 * 正式高并发时可迁移到 Redis 滑动窗。
 */

import { sql } from './db';

const MINUTE = 60_000;
const DAY = 86_400_000;

export type RateRule = { limit: number; windowMs: number };

/** 各动作的限流规则 */
export const RATE_RULES = {
  generate: {
    perIpMinute: { limit: 5, windowMs: MINUTE },
    perIpDay: { limit: 40, windowMs: DAY },
    globalDay: { limit: 2000, windowMs: DAY }
  },
  createStory: {
    perIpMinute: { limit: 10, windowMs: MINUTE }
  }
} as const;

/**
 * 原子地"自增并判断是否超限"。
 * 返回 { allowed, remaining, retryAfterSec }
 */
async function hitBucket(bucket: string, rule: RateRule): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}> {
  if (!sql) return { allowed: true, remaining: rule.limit, retryAfterSec: 0 };
  const now = Date.now();
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;

  // UPSERT: 同窗 +1, 跨窗重置为 1
  const rows = (await sql`
    INSERT INTO rate_limits (bucket, count, window_start, updated_at)
    VALUES (${bucket}, 1, ${windowStart}, ${now})
    ON CONFLICT (bucket) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start = ${windowStart}
                   THEN rate_limits.count + 1
                   ELSE 1 END,
      window_start = ${windowStart},
      updated_at = ${now}
    RETURNING count
  `) as Array<{ count: number }>;

  const count = rows[0]?.count ?? 1;
  const allowed = count <= rule.limit;
  const retryAfterSec = allowed ? 0 : Math.ceil((windowStart + rule.windowMs - now) / 1000);
  return { allowed, remaining: Math.max(0, rule.limit - count), retryAfterSec };
}

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfterSec: number; scope: 'ip' | 'global' };

/**
 * 生成接口限流: IP 分钟窗 + IP 天窗 + 全局天窗
 * 注意: 会真实自增计数, 因此应在"确定要生成"前调用一次。
 */
export async function checkGenerateLimit(ip: string): Promise<LimitResult> {
  const r = RATE_RULES.generate;

  const min = await hitBucket(`ip:${ip}:gen:min`, r.perIpMinute);
  if (!min.allowed) {
    return { ok: false, scope: 'ip', retryAfterSec: min.retryAfterSec, reason: '操作太频繁，请稍后再试' };
  }
  const day = await hitBucket(`ip:${ip}:gen:day`, r.perIpDay);
  if (!day.allowed) {
    return { ok: false, scope: 'ip', retryAfterSec: day.retryAfterSec, reason: '今日生成次数已达上限，请明天再来' };
  }
  const global = await hitBucket('global:gen:day', r.globalDay);
  if (!global.allowed) {
    return { ok: false, scope: 'global', retryAfterSec: global.retryAfterSec, reason: '今日服务繁忙，请稍后再试' };
  }
  return { ok: true };
}

/** 创建故事限流: 仅 IP 分钟窗 */
export async function checkCreateStoryLimit(ip: string): Promise<LimitResult> {
  const min = await hitBucket(`ip:${ip}:create:min`, RATE_RULES.createStory.perIpMinute);
  if (!min.allowed) {
    return { ok: false, scope: 'ip', retryAfterSec: min.retryAfterSec, reason: '操作太频繁，请稍后再试' };
  }
  return { ok: true };
}

/** 从请求头提取客户端 IP (兼容 Vercel / 反向代理) */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
