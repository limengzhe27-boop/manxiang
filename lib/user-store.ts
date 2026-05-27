/**
 * 服务端用户数据层 (Neon PostgreSQL)
 *   - app_users: 资料 / 偏好 / 套餐
 *   - usage_credits: 每日免费额度 + 奖励积分
 *   - credit_transactions: 积分流水
 *
 * 用户身份: 匿名 deviceId (无登录), 首次访问按 deviceId 建用户
 * ⚠️ 仅服务端使用, 禁止在 'use client' 中 import
 */

import { sql } from './db';

export type UserPrefs = {
  generationDone: boolean;
  seedUpdates: boolean;
  weeklyPicks: boolean;
  reducedMotion: boolean;
  platformOps: boolean;
  communityVisible: boolean;
  productResearch: boolean;
};

export const DEFAULT_PREFS: UserPrefs = {
  generationDone: true,
  seedUpdates: false,
  weeklyPicks: true,
  reducedMotion: false,
  platformOps: true,
  communityVisible: false,
  productResearch: true
};

export type UserProfile = {
  id: string;
  nickname: string;
  avatarChar: string;
  phone: string;
  email: string;
  plan: 'free' | 'pro';
  planExpiresAt: number | null;
  prefs: UserPrefs;
  credits: {
    freeDailyLimit: number;
    freeUsedToday: number;
    bonusCredits: number;
    resetDate: string;
  };
};

function genUserId() {
  const t = Date.now().toString(36).slice(-6);
  const r = Math.random().toString(36).slice(2, 8);
  return `u_${t}${r}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

type UserRow = {
  id: string;
  nickname: string;
  avatar_char: string | null;
  phone: string | null;
  email: string | null;
  plan: string;
  plan_expires_at: number | null;
  prefs: Partial<UserPrefs> | null;
};

type CreditRow = {
  free_daily_limit: number;
  free_used_today: number;
  bonus_credits: number;
  reset_date: string;
};

async function readCredits(userId: string): Promise<UserProfile['credits']> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  const today = todayStr();
  const rows = (await sql`
    SELECT free_daily_limit, free_used_today, bonus_credits, reset_date
    FROM usage_credits WHERE user_id = ${userId} LIMIT 1
  `) as CreditRow[];

  if (rows.length === 0) {
    const now = Date.now();
    await sql`
      INSERT INTO usage_credits (user_id, free_daily_limit, free_used_today, bonus_credits, reset_date, updated_at)
      VALUES (${userId}, 3, 0, 0, ${today}, ${now})
      ON CONFLICT (user_id) DO NOTHING
    `;
    return { freeDailyLimit: 3, freeUsedToday: 0, bonusCredits: 0, resetDate: today };
  }

  const c = rows[0];
  // 跨天重置 free_used_today
  if (c.reset_date !== today) {
    await sql`
      UPDATE usage_credits SET free_used_today = 0, reset_date = ${today}, updated_at = ${Date.now()}
      WHERE user_id = ${userId}
    `;
    return { freeDailyLimit: c.free_daily_limit, freeUsedToday: 0, bonusCredits: c.bonus_credits, resetDate: today };
  }
  return {
    freeDailyLimit: c.free_daily_limit,
    freeUsedToday: c.free_used_today,
    bonusCredits: c.bonus_credits,
    resetDate: c.reset_date
  };
}

function rowToProfile(row: UserRow, credits: UserProfile['credits']): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarChar: row.avatar_char || '漫',
    phone: row.phone || '',
    email: row.email || '',
    plan: row.plan === 'pro' ? 'pro' : 'free',
    planExpiresAt: row.plan_expires_at,
    prefs: { ...DEFAULT_PREFS, ...(row.prefs || {}) },
    credits
  };
}

/** 按 deviceId 取用户, 没有就建一个 */
export async function getOrCreateUserByDevice(deviceId: string): Promise<UserProfile> {
  if (!sql) throw new Error('DATABASE_URL 未配置');

  const found = (await sql`
    SELECT id, nickname, avatar_char, phone, email, plan, plan_expires_at, prefs
    FROM app_users WHERE device_id = ${deviceId} LIMIT 1
  `) as UserRow[];

  if (found.length > 0) {
    const credits = await readCredits(found[0].id);
    return rowToProfile(found[0], credits);
  }

  // 新建
  const now = Date.now();
  const id = genUserId();
  await sql`
    INSERT INTO app_users (id, device_id, nickname, avatar_char, plan, prefs, created_at, updated_at)
    VALUES (${id}, ${deviceId}, '漫想者', '漫', 'free', ${JSON.stringify(DEFAULT_PREFS)}, ${now}, ${now})
    ON CONFLICT (device_id) DO NOTHING
  `;
  // 并发兜底: 再查一次 (可能别的请求已插入)
  const again = (await sql`
    SELECT id, nickname, avatar_char, phone, email, plan, plan_expires_at, prefs
    FROM app_users WHERE device_id = ${deviceId} LIMIT 1
  `) as UserRow[];
  const credits = await readCredits(again[0].id);
  return rowToProfile(again[0], credits);
}

/** 更新资料 (昵称 / 头像字 / 手机 / 邮箱) */
export async function updateProfileFields(
  userId: string,
  fields: Partial<Pick<UserProfile, 'nickname' | 'avatarChar' | 'phone' | 'email'>>
): Promise<void> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await sql`
    UPDATE app_users SET
      nickname    = COALESCE(${fields.nickname ?? null}, nickname),
      avatar_char = COALESCE(${fields.avatarChar ?? null}, avatar_char),
      phone       = COALESCE(${fields.phone ?? null}, phone),
      email       = COALESCE(${fields.email ?? null}, email),
      updated_at  = ${Date.now()}
    WHERE id = ${userId}
  `;
}

/** 更新偏好开关 */
export async function updatePrefs(userId: string, prefs: UserPrefs): Promise<void> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  await sql`
    UPDATE app_users SET prefs = ${JSON.stringify(prefs)}, updated_at = ${Date.now()}
    WHERE id = ${userId}
  `;
}

/** 开通 / 续费会员 */
export async function activatePlan(
  userId: string,
  planId: 'first' | 'month' | 'year'
): Promise<{ plan: 'pro'; planExpiresAt: number }> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  const now = Date.now();
  const DAY = 86400_000;
  const durationDays = planId === 'year' ? 365 : 30;
  const expiresAt = now + durationDays * DAY;
  await sql`
    UPDATE app_users SET plan = 'pro', plan_expires_at = ${expiresAt}, updated_at = ${now}
    WHERE id = ${userId}
  `;
  // PRO 提升每日额度
  await sql`
    UPDATE usage_credits SET free_daily_limit = 50, updated_at = ${now}
    WHERE user_id = ${userId}
  `;
  return { plan: 'pro', planExpiresAt: expiresAt };
}

/** 购买 / 奖励积分 (写流水 + 累加) */
export async function addCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<number> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  const now = Date.now();
  const txId = `ct_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await sql`
    INSERT INTO credit_transactions (id, user_id, amount, reason, created_at)
    VALUES (${txId}, ${userId}, ${amount}, ${reason}, ${now})
  `;
  const rows = (await sql`
    UPDATE usage_credits SET bonus_credits = bonus_credits + ${amount}, updated_at = ${now}
    WHERE user_id = ${userId}
    RETURNING bonus_credits
  `) as Array<{ bonus_credits: number }>;
  return rows[0]?.bonus_credits ?? 0;
}

/** 1 话生成消耗的积分 (免费额度用尽后用积分抵) */
export const CREDITS_PER_CHAPTER = 10;

export type QuotaCheck =
  | { allowed: true; via: 'free' | 'credits'; remainingFree: number; bonusCredits: number }
  | { allowed: false; reason: string; remainingFree: number; bonusCredits: number };

/**
 * 检查并消耗一次生成额度 (原子: 先查再扣)
 * 规则:
 *   1. 当天免费额度 free_used_today < free_daily_limit → 扣免费额度
 *   2. 免费用尽 → 扣 bonus_credits (每话 CREDITS_PER_CHAPTER)
 *   3. 都不够 → 拒绝
 */
export async function consumeQuota(userId: string): Promise<QuotaCheck> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  const today = todayStr();
  const now = Date.now();

  // 确保有 credits 行 + 跨天重置 (readCredits 内含重置逻辑)
  const credits = await readCredits(userId);

  // 1. 还有免费额度
  if (credits.freeUsedToday < credits.freeDailyLimit) {
    await sql`
      UPDATE usage_credits SET free_used_today = free_used_today + 1, reset_date = ${today}, updated_at = ${now}
      WHERE user_id = ${userId}
    `;
    return {
      allowed: true,
      via: 'free',
      remainingFree: credits.freeDailyLimit - credits.freeUsedToday - 1,
      bonusCredits: credits.bonusCredits
    };
  }

  // 2. 用积分抵
  if (credits.bonusCredits >= CREDITS_PER_CHAPTER) {
    const txId = `ct_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await sql`
      UPDATE usage_credits SET bonus_credits = bonus_credits - ${CREDITS_PER_CHAPTER}, updated_at = ${now}
      WHERE user_id = ${userId}
    `;
    await sql`
      INSERT INTO credit_transactions (id, user_id, amount, reason, created_at)
      VALUES (${txId}, ${userId}, ${-CREDITS_PER_CHAPTER}, 'generate', ${now})
    `;
    return {
      allowed: true,
      via: 'credits',
      remainingFree: 0,
      bonusCredits: credits.bonusCredits - CREDITS_PER_CHAPTER
    };
  }

  // 3. 都不够
  return {
    allowed: false,
    reason: '今日免费额度已用完，积分也不足。升级 PRO 或购买积分后可继续创作。',
    remainingFree: 0,
    bonusCredits: credits.bonusCredits
  };
}

/** 注销账号: 删除用户及关联数据 (usage_credits / credit_transactions 走 CASCADE) */
export async function deleteUserByDevice(deviceId: string): Promise<boolean> {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  const rows = (await sql`
    DELETE FROM app_users WHERE device_id = ${deviceId} RETURNING id
  `) as Array<{ id: string }>;
  return rows.length > 0;
}

/** 积分流水 (最近 N 条) */
export async function listCreditTransactions(userId: string, limit = 20) {
  if (!sql) throw new Error('DATABASE_URL 未配置');
  return (await sql`
    SELECT id, amount, reason, created_at
    FROM credit_transactions WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit}
  `) as Array<{ id: string; amount: number; reason: string; created_at: number }>;
}
