/**
 * POST /api/me/billing
 *   body:
 *     { action: 'activate', planId: 'first'|'month'|'year' }   开通/续费会员
 *     { action: 'buyCredits', amount: number }                 购买积分
 *
 * GET  /api/me/billing    取积分流水
 *
 * 身份: 请求头 x-device-id
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUserByDevice,
  activatePlan,
  addCredits,
  listCreditTransactions
} from '@/lib/user-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceIdOf(req: NextRequest): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id && id.length >= 6 ? id : null;
}

const VALID_CREDIT_PACKS = new Set([60, 220, 400]);

export async function POST(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少设备标识' }, { status: 400 });

  let body: { action?: string; planId?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体非法 JSON' }, { status: 400 });
  }

  try {
    const user = await getOrCreateUserByDevice(deviceId);

    if (body.action === 'activate') {
      const planId = body.planId;
      if (planId !== 'first' && planId !== 'month' && planId !== 'year') {
        return NextResponse.json({ error: '套餐不存在' }, { status: 400 });
      }
      await activatePlan(user.id, planId);
    } else if (body.action === 'buyCredits') {
      const amount = Number(body.amount);
      if (!VALID_CREDIT_PACKS.has(amount)) {
        return NextResponse.json({ error: '积分档位不存在' }, { status: 400 });
      }
      await addCredits(user.id, amount, 'purchase');
    } else {
      return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }

    const fresh = await getOrCreateUserByDevice(deviceId);
    return NextResponse.json({ user: fresh });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me/billing POST]', msg);
    return NextResponse.json({ error: '操作失败：' + msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const deviceId = deviceIdOf(req);
  if (!deviceId) return NextResponse.json({ error: '缺少设备标识' }, { status: 400 });
  try {
    const user = await getOrCreateUserByDevice(deviceId);
    const transactions = await listCreditTransactions(user.id, 20);
    return NextResponse.json({ transactions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/me/billing GET]', msg);
    return NextResponse.json({ error: '获取流水失败：' + msg }, { status: 500 });
  }
}
