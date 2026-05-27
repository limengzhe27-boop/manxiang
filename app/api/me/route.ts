/**
 * GET   /api/me           取当前用户(按 x-device-id), 不存在则自动创建
 * PATCH /api/me           更新资料 / 偏好
 *   body: { profile?: {nickname,avatarChar,phone,email}, prefs?: {...} }
 *
 * 身份: 请求头 x-device-id (匿名设备 ID)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUserByDevice,
  updateProfileFields,
  updatePrefs,
  deleteUserByDevice,
  type UserPrefs
} from '@/lib/user-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

export async function GET(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少设备标识' }, { status: 400 });
  try {
    const user = await getOrCreateUserByDevice(deviceId);
    return NextResponse.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me GET]', msg);
    return NextResponse.json({ error: '获取用户失败：' + msg }, { status: 500 });
  }
}

type PatchBody = {
  profile?: { nickname?: string; avatarChar?: string; phone?: string; email?: string };
  prefs?: UserPrefs;
};

export async function PATCH(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少设备标识' }, { status: 400 });

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }

  try {
    const user = await getOrCreateUserByDevice(deviceId);

    if (body.profile) {
      // 简单校验
      const p = body.profile;
      if (p.nickname !== undefined && p.nickname.trim().length === 0) {
        return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
      }
      if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
      }
      await updateProfileFields(user.id, {
        nickname: p.nickname?.trim(),
        avatarChar: p.avatarChar?.trim().slice(0, 1),
        phone: p.phone?.trim(),
        email: p.email?.trim()
      });
    }

    if (body.prefs) {
      await updatePrefs(user.id, body.prefs);
    }

    const fresh = await getOrCreateUserByDevice(deviceId);
    return NextResponse.json({ user: fresh });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me PATCH]', msg);
    return NextResponse.json({ error: '保存失败：' + msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少设备标识' }, { status: 400 });
  try {
    await deleteUserByDevice(deviceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me DELETE]', msg);
    return NextResponse.json({ error: '注销失败：' + msg }, { status: 500 });
  }
}
