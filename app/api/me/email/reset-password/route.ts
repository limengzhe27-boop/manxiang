/**
 * POST /api/me/email/reset-password
 *   { email, code, newPassword }
 *
 * 用邮箱验证码重置密码 (找回密码)
 * 无需登录态; 校验通过后, 把 email 对应账号的密码改为 newPassword
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { setUserPassword } from '@/lib/user-store';
import { verifyEmailCode } from '@/lib/email-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }
  const email = (body.email ?? '').trim().toLowerCase();
  const code = (body.code ?? '').trim();
  const newPassword = (body.newPassword ?? '').trim();
  if (!email || !code) return NextResponse.json({ error: '缺少 email 或 code' }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ error: '新密码至少 6 位' }, { status: 400 });
  if (!sql) return NextResponse.json({ error: 'DATABASE_URL 未配置' }, { status: 500 });

  const v = await verifyEmailCode(email, 'reset', code);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  // 找邮箱对应的账号
  const rows = (await sql`SELECT id FROM app_users WHERE email = ${email} LIMIT 1`) as Array<{ id: string }>;
  if (rows.length === 0) return NextResponse.json({ error: '该邮箱未绑定任何账号' }, { status: 404 });

  await setUserPassword(rows[0].id, newPassword);
  return NextResponse.json({ ok: true });
}
