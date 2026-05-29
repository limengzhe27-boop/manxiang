/**
 * POST /api/me/email/bind
 *   { email, code }
 *
 * 校验验证码后, 把邮箱绑到当前登录账号。
 * 需要 x-device-id (登录态)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getOrCreateUserByDevice, updateProfileFields } from '@/lib/user-store';
import { verifyEmailCode } from '@/lib/email-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function POST(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少身份' }, { status: 401 });

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }
  const email = (body.email ?? '').trim().toLowerCase();
  const code = (body.code ?? '').trim();
  if (!email || !code) return NextResponse.json({ error: '缺少 email 或 code' }, { status: 400 });

  const r = await verifyEmailCode(email, 'bind', code);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  // 检查该邮箱是否已被其他账号绑定
  if (sql) {
    const owners = (await sql`SELECT id FROM app_users WHERE email = ${email} LIMIT 1`) as Array<{ id: string }>;
    if (owners.length > 0) {
      const user = await getOrCreateUserByDevice(deviceId);
      if (owners[0].id !== user.id) {
        return NextResponse.json({ error: '该邮箱已被其他账号绑定' }, { status: 409 });
      }
    }
  }

  const user = await getOrCreateUserByDevice(deviceId);
  await updateProfileFields(user.id, { email });
  const fresh = await getOrCreateUserByDevice(deviceId);
  return NextResponse.json({ ok: true, user: fresh });
}
