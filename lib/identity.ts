'use client';

/**
 * 匿名设备 ID
 * 无登录系统时, 用 localStorage 里的 deviceId 标识用户。
 * 所有 /api/me* 请求带上 x-device-id 头。
 */

const KEY = 'manxiang_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      'dev_' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

/** 切换本机身份为指定找回码 (恢复账号用) */
export function setDeviceId(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, id.trim());
}

// ===== 账号页登录态 (绑定到当前 deviceId) =====
const AUTH_KEY = 'manxiang_authed_device';

/** 当前设备是否已登录账号 (登录态 = 已通过密码校验, 且与当前 deviceId 匹配) */
export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_KEY) === getDeviceId();
}

export function setAuthed() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_KEY, getDeviceId());
}

export function clearAuthed() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_KEY);
}

/** 带 deviceId 头的 fetch 包装 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const deviceId = getDeviceId();
  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
      ...(init.headers || {})
    }
  });
}
