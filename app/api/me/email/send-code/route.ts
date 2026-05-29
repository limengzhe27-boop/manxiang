/**
 * POST /api/me/email/send-code
 *   { email, purpose: 'bind' | 'reset' }
 *
 * - purpose=bind: 当前账号绑定邮箱前发码 (需要登录态)
 * - purpose=reset: 找回密码前发码 (无需登录, 但 email 必须已绑定)
 *
 * 60 秒重发冷却 + IP 限流
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getOrCreateUserByDevice } from '@/lib/user-store';
import { createEmailCode } from '@/lib/email-codes';
import { sendEmail, verificationEmailHtml } from '@/lib/email';
import { clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; purpose?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }
  const email = (body.email ?? '').trim().toLowerCase();
  const purpose = body.purpose === 'reset' ? 'reset' : body.purpose === 'bind' ? 'bind' : null;

  if (!purpose) return NextResponse.json({ error: '未知用途' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
  if (!sql) return NextResponse.json({ error: 'DATABASE_URL 未配置' }, { status: 500 });

  // IP 限流: 同 IP 每分钟最多 3 次
  // (简单内联, 复用之前的 hitBucket 也行)
  const ipKey = `ip:${clientIp(req)}:email-code:min`;
  const now = Date.now();
  const ws = Math.floor(now / 60000) * 60000;
  const rl = (await sql`
    INSERT INTO rate_limits (bucket, count, window_start, updated_at)
    VALUES (${ipKey}, 1, ${ws}, ${now})
    ON CONFLICT (bucket) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start = ${ws} THEN rate_limits.count + 1 ELSE 1 END,
      window_start = ${ws}, updated_at = ${now}
    RETURNING count
  `) as Array<{ count: number }>;
  if (rl[0].count > 3) {
    return NextResponse.json({ error: '操作太频繁，请稍后再试' }, { status: 429 });
  }

  let userId: string | null = null;
  if (purpose === 'bind') {
    // 必须登录
    const deviceId = deviceIdOf(req);
    if (!deviceId) return NextResponse.json({ error: '缺少身份' }, { status: 401 });
    const user = await getOrCreateUserByDevice(deviceId);
    userId = user.id;
  } else {
    // reset: 邮箱必须已绑定某账号
    const rows = (await sql`SELECT id FROM app_users WHERE email = ${email} LIMIT 1`) as Array<{ id: string }>;
    if (rows.length === 0) {
      return NextResponse.json({ error: '该邮箱未绑定任何账号' }, { status: 404 });
    }
    userId = rows[0].id;
  }

  // 生成 + 入库
  const r = await createEmailCode(email, purpose, userId);
  if (!r.ok) {
    return NextResponse.json(
      { error: r.error },
      { status: 429, headers: r.retryAfterSec ? { 'Retry-After': String(r.retryAfterSec) } : {} }
    );
  }

  // 发邮件
  const { subject, html } = verificationEmailHtml(r.code, purpose);
  const sent = await sendEmail({ to: email, subject, html });
  if (!sent.ok) {
    return NextResponse.json({ error: '邮件发送失败：' + sent.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
