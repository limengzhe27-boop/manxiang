/**
 * SiliconFlow 硅基流动 文生图客户端
 * ⚠️ 仅在服务端使用 API_KEY 通过环境变量读取
 */

import type { CharacterProfile } from './deepseek';

const API_KEY = process.env.SILICONFLOW_API_KEY;
const MODEL = process.env.SILICONFLOW_MODEL || 'baidu/ERNIE-Image-Turbo';
const MODEL_FALLBACK = process.env.SILICONFLOW_MODEL_FALLBACK || 'Kwai-Kolors/Kolors';
const BASE_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';

if (!API_KEY) {
  console.warn('[siliconflow] SILICONFLOW_API_KEY 未配置, 文生图调用会失败');
}

// ========== Prompt 固定 6 段结构 ==========

const STYLE_PREFIX =
  'manga style, black and white, detailed lineart, clean lines, comic panel, high quality illustration';

const SAFETY_SUFFIX = 'safe for work, no nudity, no gore, no violence, no text, no watermark';

const NEGATIVE_PROMPT_BASE =
  'realistic photo, 3d render, photorealistic, watermark, text, signature, ' +
  'color, colored, blurry, low quality, deformed, ugly, mutated, extra limbs, ' +
  'bad anatomy, multiple panels, frame, border, two people, multiple characters, crowd';

// 性别强化 / 反向
const GENDER_BOOST_MALE = 'male, man, masculine features, strong jawline, broad shoulders';
const GENDER_NEG_MALE = 'female, girl, feminine, long eyelashes, makeup, curves';

const GENDER_BOOST_FEMALE = 'female, woman, feminine features, beautiful woman';
const GENDER_NEG_FEMALE = 'male, man, masculine, beard, mustache, broad shoulders';

// 构图词 (镜头景别) 列表 用于在 scene 里识别
const SHOT_KEYWORDS = [
  'close-up shot',
  'close-up',
  'medium shot',
  'half body shot',
  'full body shot',
  'wide shot',
  'establishing shot'
];

/** 从 scenePrompt 里识别已有的构图词, 没有则给一个默认 */
function pickShotKeyword(scene: string): string {
  const lower = scene.toLowerCase();
  for (const k of SHOT_KEYWORDS) {
    if (lower.includes(k.toLowerCase())) return k;
  }
  // 默认半身
  return 'medium shot';
}

/** sanitize 武器/血腥词 避免被审核拦截 */
function sanitizeScene(p: string): string {
  return p
    .replace(/\b(blood|bloody|gore)\b/gi, 'red ink')
    .replace(/\bcorpse|dead body\b/gi, 'still figure')
    .replace(/\bwound|injury\b/gi, 'mark')
    .replace(/\b(gun|pistol|rifle)\b/gi, 'object')
    .replace(/\b(knife|blade|sword|dagger)\b/gi, 'tool')
    .replace(/\b(kill|murder|stab|slash)\b/gi, 'confront')
    .replace(/\b(naked|nude)\b/gi, 'figure')
    .replace(/\b(suicide|hanging)\b/gi, 'silhouette');
}

/**
 * 解析 prompt 里所有 @角色名 标记
 * 单角色规则: 只取第一个匹配的角色, 多余的 @标记被剥离
 */
function resolveCharacterMentions(
  scenePrompt: string,
  allCharacters: CharacterProfile[]
): { cleanScene: string; mentioned: CharacterProfile | null } {
  let cleanScene = scenePrompt;
  let firstMatched: CharacterProfile | null = null;

  for (const c of allCharacters) {
    const tag = '@' + c.name;
    if (cleanScene.includes(tag)) {
      if (!firstMatched) firstMatched = c;
      // 把 @林远 替换为 the character (避免把名字传给模型造成困扰)
      cleanScene = cleanScene.split(tag).join('the character');
    }
  }
  return { cleanScene, mentioned: firstMatched };
}

/**
 * 构建最终发给文生图模型的完整 prompt + negative_prompt + seed
 * 结构: [风格] + [角色外貌] + [性别] + [场景] + [构图词] + [安全词]
 */
export function buildFinalPrompt(
  scenePrompt: string,
  allCharacters: CharacterProfile[]
): { prompt: string; negativePrompt: string; seed?: number } {
  const { cleanScene, mentioned } = resolveCharacterMentions(scenePrompt, allCharacters);
  const sanitized = sanitizeScene(cleanScene);
  const shot = pickShotKeyword(sanitized);

  let charPart = '';
  let genderBoost = '';
  let negGender = '';
  let seed: number | undefined;

  if (mentioned) {
    charPart = `Character: ${mentioned.appearance}`;
    if (mentioned.gender === 'male') {
      genderBoost = GENDER_BOOST_MALE;
      negGender = GENDER_NEG_MALE;
    } else if (mentioned.gender === 'female') {
      genderBoost = GENDER_BOOST_FEMALE;
      negGender = GENDER_NEG_FEMALE;
    }
    seed = mentioned.seed;
  }

  // 固定 6 段结构: [风格] [角色] [性别] [场景] [构图] [安全]
  const finalPrompt = [
    STYLE_PREFIX,
    charPart,
    genderBoost,
    `Scene: ${sanitized}`,
    `composition: ${shot}, single character only` + (mentioned ? '' : ' or no character'),
    SAFETY_SUFFIX
  ]
    .filter(Boolean)
    .join('. ');

  const negativePrompt = [NEGATIVE_PROMPT_BASE, negGender].filter(Boolean).join(', ');

  return { prompt: finalPrompt, negativePrompt, seed };
}

// ========== API 调用 ==========

async function callImageApi(
  model: string,
  prompt: string,
  negativePrompt?: string,
  seed?: number
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    image_size: '1024x768'
  };
  if (negativePrompt) body.negative_prompt = negativePrompt;
  if (typeof seed === 'number') body.seed = seed;

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SiliconFlow ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const url = data?.images?.[0]?.url || data?.data?.[0]?.url;
  if (!url) throw new Error('SiliconFlow 响应缺少图片 URL: ' + JSON.stringify(data).slice(0, 200));
  return url as string;
}

/**
 * 单张图生成 含模型回退 + 三级 prompt 兜底
 *
 * 主模型: baidu/ERNIE-Image-Turbo (默认)
 * 备用模型: Kwai-Kolors/Kolors (主模型暂停 / 不存在 / 频繁失败时切换)
 *
 * Prompt 兜底:
 *  1) 完整 [风格+角色+性别+场景+构图+安全] + seed
 *  2) sanitize 过的完整 prompt + seed
 *  3) 极简 prompt 无角色无 seed
 */
export async function generateImage(
  scenePrompt: string,
  characters: CharacterProfile[] = []
): Promise<string> {
  if (!API_KEY) throw new Error('SILICONFLOW_API_KEY 未配置');

  const built = buildFinalPrompt(scenePrompt, characters);
  console.log(
    `[siliconflow] model=${MODEL} seed=${built.seed ?? 'random'} prompt=${built.prompt.slice(0, 160)}…`
  );

  // 尝试: [主模型 → 备用模型] × [完整 → sanitize → 极简]
  const promptAttempts = [
    built.prompt,
    sanitizeScene(built.prompt),
    `${STYLE_PREFIX}. A quiet atmospheric scene, single subject, ${SAFETY_SUFFIX}`
  ];

  const modelAttempts = [MODEL, MODEL_FALLBACK].filter(
    (m, i, arr) => m && arr.indexOf(m) === i
  );

  let lastErr: unknown = null;
  for (let m = 0; m < modelAttempts.length; m++) {
    const model = modelAttempts[m];
    for (let i = 0; i < promptAttempts.length; i++) {
      try {
        const useSeed = i < 2 ? built.seed : undefined;
        const useNeg = i < 2 ? built.negativePrompt : NEGATIVE_PROMPT_BASE;
        return await callImageApi(model, promptAttempts[i], useNeg, useSeed);
      } catch (err) {
        lastErr = err;
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[siliconflow] ${model} attempt ${i + 1}/3 失败: ${reason.slice(0, 150)}`
        );
        // 第一次失败稍等避免限流
        if (!(m === modelAttempts.length - 1 && i === promptAttempts.length - 1)) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('图像生成失败');
}

/**
 * 并行生成多张图
 * 任何一张失败就把这一张的 url 返回 null, 不阻塞其他
 */
export async function generateImages(
  prompts: string[],
  characters: CharacterProfile[] = []
): Promise<(string | null)[]> {
  const results = await Promise.allSettled(
    prompts.map((p) => generateImage(p, characters))
  );
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[siliconflow] 第 ${i + 1} 格生成失败: ${reason}`);
      console.error(`  scene prompt: ${prompts[i].slice(0, 120)}…`);
    }
  });
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}
