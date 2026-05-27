/**
 * DeepSeek 客户端 仅在服务端使用
 * ⚠️ 这个文件如果在 'use client' 组件里 import 会报错，符合预期
 */

const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

if (!API_KEY) {
  console.warn('[deepseek] DEEPSEEK_API_KEY 未配置, 调用会失败');
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GeneratedPanel = {
  caption: string;
  prompt: string;
  /** 故事 4-Beat 结构标记 SETUP / TURN / CLIMAX / HOOK */
  beat?: 'SETUP' | 'TURN' | 'CLIMAX' | 'HOOK';
  /** 从正文中抠出的对应原文片段 (导出长图用) */
  excerpt?: string;
  /** 由文生图 API 填入；null 表示生成失败 */
  imageUrl?: string | null;
};

export type CharacterProfile = {
  name: string;
  gender: 'male' | 'female' | 'other';
  appearance: string;
  /** 固定 seed 用于该角色每次生成图像保持一致 */
  seed?: number;
};

export type GeneratedChapter = {
  title: string;
  text: string;
  panels: GeneratedPanel[];
  choices: Array<{ emotion: string; text: string }>;
  summary: string;
  /** 首话 LLM 抽出的角色档案 续写时可能为空 */
  characters?: CharacterProfile[];
  /** 续写时本话引入的新角色 (一般为空) */
  characters_new?: CharacterProfile[];
};

/** 流式调用 DeepSeek 一次性返回完整 JSON */
export async function generateChapter(messages: ChatMessage[]): Promise<GeneratedChapter> {
  if (!API_KEY) throw new Error('DEEPSEEK_API_KEY 未配置');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.85, // 提升创造性
      top_p: 0.95,
      max_tokens: 2000,
      stream: false
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 响应为空');

  try {
    return JSON.parse(content) as GeneratedChapter;
  } catch (err) {
    throw new Error(`DeepSeek 返回非合法 JSON: ${content.slice(0, 200)}`);
  }
}

/** 流式调用：边生成边返回文字 token（仅返回 text 部分用于打字机效果）
 *  其它字段在最后一次性给前端
 */
export async function* generateChapterStream(messages: ChatMessage[]) {
  if (!API_KEY) throw new Error('DEEPSEEK_API_KEY 未配置');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.85,
      top_p: 0.95,
      max_tokens: 2000,
      stream: true
    })
  });

  if (!res.ok || !res.body) {
    throw new Error(`DeepSeek API ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE: 每行 "data: {...}"
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // 留最后未完整的一行

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const obj = JSON.parse(payload);
        const delta = obj?.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // 单条 chunk 解析失败忽略
      }
    }
  }
}
