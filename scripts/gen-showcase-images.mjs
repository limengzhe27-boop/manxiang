#!/usr/bin/env node
/**
 * 批量生成首页展示用的 AI 图片
 *   - HeroPreview 4 张
 *   - Featured Stories 3 × 4 = 12 张
 *   - 共 16 张
 *
 * 输出: public/showcase/{key}.png
 *
 * 用法:
 *   1. 确保 .env.local 中已配置 SILICONFLOW_API_KEY 且余额充足
 *   2. cd web/ && npm run gen-showcase
 *   3. 已存在的图片会跳过, 加 --force 强制重生
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/showcase');
const FORCE = process.argv.includes('--force');
const CONCURRENCY = 3;

function loadEnv() {
  const envPath = resolve(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ 未找到 .env.local');
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

// 从 lib/showcase.ts 解析所有 {key, imagePrompt}
const text = readFileSync(resolve(ROOT, 'lib/showcase.ts'), 'utf-8');
const promptMatches = [
  ...text.matchAll(/key:\s*'([^']+)',[\s\S]*?imagePrompt:\s*`([^`]+)`/g)
];
if (promptMatches.length === 0) {
  console.error('❌ 没解析到 prompt');
  process.exit(1);
}
console.log(`📦 解析到 ${promptMatches.length} 张 showcase 图`);

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

async function callApi(prompt) {
  const NEG =
    'realistic photo, 3d render, photorealistic, color, watermark, text, signature, blurry, low quality, deformed, two people, crowd';
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
  if (!url) throw new Error('响应缺少 URL');
  return url;
}

async function downloadAndSave(imageUrl, outPath) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`下载失败 ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

async function genOne([key, prompt]) {
  const outPath = resolve(OUT_DIR, `${key}.png`);
  if (!FORCE && existsSync(outPath)) {
    console.log(`  ⏭  跳过 ${key}`);
    return { key, status: 'skipped' };
  }
  try {
    process.stdout.write(`  🎨 ${key}… `);
    const t0 = Date.now();
    const url = await callApi(prompt);
    await downloadAndSave(url, outPath);
    console.log(`✅ ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return { key, status: 'ok' };
  } catch (e) {
    console.log(`❌ ${e.message.slice(0, 100)}`);
    return { key, status: 'failed', error: e.message };
  }
}

async function run() {
  console.log(`🚀 模型: ${MODEL}`);
  console.log(`📁 输出: public/showcase/`);
  console.log();

  const queue = promptMatches.map((m) => [m[1], m[2]]);
  const results = [];
  const workers = Array.from({ length: CONCURRENCY }).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const r = await genOne(item);
      results.push(r);
      await new Promise((r) => setTimeout(r, 200));
    }
  });
  await Promise.all(workers);

  console.log();
  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed');
  console.log(`📊 结果: 成功 ${ok} · 跳过 ${skipped} · 失败 ${failed.length}`);
  if (failed.length > 0) process.exit(1);
}

run().catch((err) => {
  console.error('💥 致命错误:', err);
  process.exit(1);
});
