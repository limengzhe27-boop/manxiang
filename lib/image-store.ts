/**
 * 分镜图永久存储
 *
 * 文生图 API (SiliconFlow) 返回的是 1 小时过期的临时 URL,
 * 这里把图片下载后转存到数据库 (base64), 返回一个永久可访问的内部 URL: /api/img/{key}
 *
 * ⚠️ 体验版方案: 数据库存 base64。正式运营请改为对象存储 (阿里云 OSS / Cloudflare R2):
 *    只需替换 storeImageFromUrl 的"保存"部分和 getImageBlob 即可, 调用方不用动。
 *
 * 仅服务端使用。
 */

import { sql } from './db';

function genKey() {
  return `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 下载临时图 URL → 存数据库 → 返回永久内部 URL (/api/img/{key})
 * 失败返回 null (调用方回退到占位图)
 */
export async function storeImageFromUrl(tempUrl: string): Promise<string | null> {
  if (!sql) return null;
  try {
    const res = await fetch(tempUrl);
    if (!res.ok) throw new Error(`下载图片失败 ${res.status}`);
    const rawType = res.headers.get('content-type') || '';
    // 图源有时返回 application/octet-stream, 强制归一为图片类型, 保证浏览器渲染
    const contentType = rawType.startsWith('image/') ? rawType : 'image/png';
    const buf = Buffer.from(await res.arrayBuffer());
    const base64 = buf.toString('base64');
    const key = genKey();
    await sql`
      INSERT INTO image_blobs (key, content_type, data_base64, bytes, created_at)
      VALUES (${key}, ${contentType}, ${base64}, ${buf.length}, ${Date.now()})
    `;
    return `/api/img/${key}`;
  } catch (err) {
    console.error('[image-store] 转存失败:', err instanceof Error ? err.message : err);
    return null;
  }
}

export type ImageBlob = { contentType: string; buffer: Buffer } | null;

/** 读取已存图片 */
export async function getImageBlob(key: string): Promise<ImageBlob> {
  if (!sql) return null;
  const rows = (await sql`
    SELECT content_type, data_base64 FROM image_blobs WHERE key = ${key} LIMIT 1
  `) as Array<{ content_type: string; data_base64: string }>;
  if (rows.length === 0) return null;
  return {
    contentType: rows[0].content_type,
    buffer: Buffer.from(rows[0].data_base64, 'base64')
  };
}
