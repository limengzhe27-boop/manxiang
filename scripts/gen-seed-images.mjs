#!/usr/bin/env node
/**
 * 批量为所有故事种子调用 SiliconFlow 文生图 API
 * 输出: public/seeds/{id}.webp
 *
 * 用法:
 *   1. 确保 .env.local 中已配置 SILICONFLOW_API_KEY
 *   2. cd web/ && npm run gen-seeds
 *   3. 等 5-10 分钟 (全量生成 × 8-15 秒/张)
 *   4. 已存在的图片会跳过, 加 --force 强制重生
 *   5. 可传 seed id 只生成指定图片: node scripts/gen-seed-images.mjs --force s36 s37
 *
 * 注意:
 *   - 每张图约 ¥0.02-0.05 (Kolors / ERNIE-Image-Turbo)
 *   - 42 张总成本约 ¥1-2
 *   - 同时并行 3 个请求避免触发限流
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/seeds');
const FORCE = process.argv.includes('--force');
const ONLY_IDS = new Set(
  process.argv
    .slice(2)
    .filter((arg) => /^s\d+$/.test(arg))
);
const CONCURRENCY = 3;

// ===== 读环境变量 =====
function loadEnv() {
  const envPath = resolve(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ 未找到 .env.local, 请先配置 SILICONFLOW_API_KEY');
    process.exit(1);
  }
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const env = loadEnv();
const API_KEY = env.SILICONFLOW_API_KEY;
const MODEL = env.SILICONFLOW_MODEL || 'baidu/ERNIE-Image-Turbo';
const BASE_URL = env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';

if (!API_KEY || API_KEY.startsWith('sk-换成')) {
  console.error('❌ SILICONFLOW_API_KEY 无效, 请到 https://cloud.siliconflow.cn/ 申请');
  process.exit(1);
}

// ===== 提取种子数据 (直接解析 ts 文件取 SEEDS 数组) =====
const seedFile = readFileSync(resolve(ROOT, 'lib/mock.ts'), 'utf-8');
const seedMatches = [
  ...seedFile.matchAll(
    /\{\s*id:\s*'(s\d+)',\s*title:\s*'([^']+)'[^}]*?imagePrompt:\s*`([^`]+)`\s*\}/g
  )
].filter((match) => ONLY_IDS.size === 0 || ONLY_IDS.has(match[1]));
if (seedMatches.length === 0) {
  console.error('❌ 解析 lib/mock.ts 失败, 没找到种子');
  process.exit(1);
}
console.log(`📦 解析到 ${seedMatches.length} 个种子`);

// ===== 创建输出目录 =====
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ===== 调用 API =====
async function callApi(prompt) {
  const NEG =
    'realistic photo, 3d render, photorealistic, color, watermark, text, signature, blurry, low quality, deformed, crowd';
  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      negative_prompt: NEG,
      image_size: '1024x768'
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const url = data?.images?.[0]?.url || data?.data?.[0]?.url;
  if (!url) throw new Error('响应缺少 URL: ' + JSON.stringify(data).slice(0, 200));
  return url;
}

async function downloadAndSave(imageUrl, outPath) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`下载图片失败 ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

async function genOne(seed) {
  const [, id, title, prompt] = seed;
  // 默认 png, 因为 SiliconFlow 返回的就是 png
  const outPath = resolve(OUT_DIR, `${id}.png`);

  if (!FORCE && existsSync(outPath)) {
    console.log(`  ⏭  跳过 ${id} (${title}) - 已存在`);
    return { id, status: 'skipped' };
  }

  try {
    process.stdout.write(`  🎨 生成 ${id} (${title})… `);
    const t0 = Date.now();
    const imageUrl = await callApi(prompt);
    await downloadAndSave(imageUrl, outPath);
    const ms = Date.now() - t0;
    console.log(`✅ ${(ms / 1000).toFixed(1)}s`);
    return { id, status: 'ok' };
  } catch (err) {
    console.log(`❌ ${err.message.slice(0, 100)}`);
    return { id, status: 'failed', error: err.message };
  }
}

// ===== 并发批量执行 =====
async function run() {
  console.log(`🚀 模型: ${MODEL}`);
  console.log(`📁 输出: public/seeds/`);
  console.log(`⚡ 并发: ${CONCURRENCY}`);
  console.log(`🔁 强制重生: ${FORCE ? '是' : '否 (用 --force 启用)'}`);
  if (ONLY_IDS.size > 0) console.log(`🎯 指定种子: ${[...ONLY_IDS].join(', ')}`);
  console.log();

  const queue = [...seedMatches];
  const results = [];

  const workers = Array.from({ length: CONCURRENCY }).map(async () => {
    while (queue.length > 0) {
      const seed = queue.shift();
      if (!seed) break;
      const r = await genOne(seed);
      results.push(r);
      // 短暂间隔避免限流
      await new Promise((r) => setTimeout(r, 200));
    }
  });
  await Promise.all(workers);

  console.log();
  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed');
  console.log(`📊 结果: 成功 ${ok} · 跳过 ${skipped} · 失败 ${failed.length}`);
  if (failed.length > 0) {
    console.log('失败的种子:');
    failed.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('💥 致命错误:', err);
  process.exit(1);
});
