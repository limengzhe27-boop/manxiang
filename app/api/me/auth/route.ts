/**
 * POST /api/me/auth
 *   { action: 'register', nickname?, password }  给当前匿名账号设访问密码 (激活)
 *   { action: 'login', password }                校验密码
 *   { action: 'changePassword', oldPassword, password }  改密
 *
 * 身份: 请求头 x-device-id
 * 说明: 密码保护"当前设备访问账号页", 跨设备仍用找回码搬账号。
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUserByDevice,
  setUserPassword,
  verifyUserPassword,
  updateProfileFields
} from '@/lib/user-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function POST(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少设备标识' }, { status: 400 });

  let body: { action?: string; nickname?: string; password?: string; oldPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }

  const password = (body.password ?? '').trim();

  try {
    const user = await getOrCreateUserByDevice(deviceId);

    if (body.action === 'register') {
      if (user.activated) {
        return NextResponse.json({ error: '该账号已设密码，请直接登录' }, { status: 409 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });
      }
      const nickname = (body.nickname ?? '').trim();
      if (nickname) {
        await updateProfileFields(user.id, { nickname: nickname.slice(0, 16) });
      }
      await setUserPassword(user.id, password);
      const fresh = await getOrCreateUserByDevice(deviceId);
      return NextResponse.json({ ok: true, user: fresh });
    }

    if (body.action === 'login') {
      if (!user.activated) {
        return NextResponse.json({ error: '该账号尚未设密码', code: 'NOT_ACTIVATED' }, { status: 409 });
      }
      const ok = await verifyUserPassword(deviceId, password);
      if (!ok) return NextResponse.json({ error: '密码错误' }, { status: 401 });
      return NextResponse.json({ ok: true, user });
    }

    if (body.action === 'changePassword') {
      if (!user.activated) {
        return NextResponse.json({ error: '尚未设置密码' }, { status: 409 });
      }
      const ok = await verifyUserPassword(deviceId, (body.oldPassword ?? '').trim());
      if (!ok) return NextResponse.json({ error: '原密码错误' }, { status: 401 });
      if (password.length < 6) return NextResponse.json({ error: '新密码至少 6 位' }, { status: 400 });
      await setUserPassword(user.id, password);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me/auth]', msg);
    return NextResponse.json({ error: '操作失败：' + msg }, { status: 500 });
  }
}
