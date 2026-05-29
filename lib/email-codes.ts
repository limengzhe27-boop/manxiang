/**
 * 邮箱验证码 服务端管理
 *   - 生成 6 位数字验证码
 *   - 写入 email_codes 表 (10 分钟有效)
 *   - 限速: 同一邮箱 60 秒只能发 1 次
 *   - 校验: 找最近未用的一条, 必须未过期 & 一致
 *
 * 仅服务端使用。
 */

import { sql } from './db';

export type CodePurpose = 'bind' | 'reset';
const CODE_TTL_MS = 10 * 60 * 1000;       // 10 分钟
const RESEND_COOLDOWN_MS = 60 * 1000;     // 60 秒重发冷却

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function genId(): string {
  return `ec_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export type SaveCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string; retryAfterSec?: number };

/** 生成并保存验证码; 60 秒内不重复发 */
export async function createEmailCode(
  email: string,
  purpose: CodePurpose,
  userId?: string | null
): Promise<SaveCodeResult> {
  if (!sql) return { ok: false, error: 'DATABASE_URL 未配置' };
  const now = Date.now();
  // 60s 限速
  const recent = (await sql`
    SELECT created_at FROM email_codes
    WHERE email = ${email} AND purpose = ${purpose}
    ORDER BY created_at DESC LIMIT 1
  `) as Array<{ created_at: number }>;
  if (recent.length > 0 && now - recent[0].created_at < RESEND_COOLDOWN_MS) {
    const remain = Math.ceil((RESEND_COOLDOWN_MS - (now - recent[0].created_at)) / 1000);
    return { ok: false, error: `请 ${remain} 秒后再请求新验证码`, retryAfterSec: remain };
  }

  const code = genCode();
  await sql`
    INSERT INTO email_codes (id, email, purpose, code, user_id, expires_at, used, created_at)
    VALUES (${genId()}, ${email}, ${purpose}, ${code}, ${userId ?? null}, ${now + CODE_TTL_MS}, FALSE, ${now})
  `;
  return { ok: true, code };
}

/** 校验验证码; 通过则标记 used (一次性) */
export async function verifyEmailCode(
  email: string,
  purpose: CodePurpose,
  code: string
): Promise<{ ok: true; userId: string | null } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: 'DATABASE_URL 未配置' };
  const now = Date.now();
  const rows = (await sql`
    SELECT id, code, expires_at, used, user_id FROM email_codes
    WHERE email = ${email} AND purpose = ${purpose}
    ORDER BY created_at DESC LIMIT 1
  `) as Array<{ id: string; code: string; expires_at: number; used: boolean; user_id: string | null }>;
  const row = rows[0];
  if (!row) return { ok: false, error: '请先获取验证码' };
  if (row.used) return { ok: false, error: '验证码已使用，请重新获取' };
  if (now > row.expires_at) return { ok: false, error: '验证码已过期，请重新获取' };
  if (row.code !== code.trim()) return { ok: false, error: '验证码错误' };
  // 标记 used
  await sql`UPDATE email_codes SET used = TRUE WHERE id = ${row.id}`;
  return { ok: true, userId: row.user_id };
}
