/**
 * POST /api/me/restore
 *   body: { code: string }   // 另一台设备的找回码 (即对方 deviceId)
 *
 * 校验该 deviceId 是否存在已注册账号。
 * 存在则返回 ok + 账号摘要, 前端把本机 deviceId 切换为该 code。
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }

  const code = (body.code ?? '').trim();
  if (!code || code.length < 6) {
    return NextResponse.json({ error: '请输入有效的找回码' }, { status: 400 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'DATABASE_URL 未配置' }, { status: 500 });
  }

  try {
    const rows = (await sql`
      SELECT id, nickname, plan FROM app_users WHERE device_id = ${code} LIMIT 1
    `) as Array<{ id: string; nickname: string; plan: string }>;

    if (rows.length === 0) {
      return NextResponse.json({ error: '找不到对应账号，请检查找回码是否正确' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      account: { nickname: rows[0].nickname, plan: rows[0].plan }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me/restore]', msg);
    return NextResponse.json({ error: '恢复失败：' + msg }, { status: 500 });
  }
}
