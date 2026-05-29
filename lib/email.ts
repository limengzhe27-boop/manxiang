/**
 * 阿里云邮件推送 (DirectMail) 封装
 * 仅服务端使用。
 *
 * 环境变量:
 *   ALIYUN_DM_ACCESS_KEY_ID
 *   ALIYUN_DM_ACCESS_KEY_SECRET
 *   ALIYUN_DM_FROM_ADDRESS    发信地址, 如 noreply@mail.manxiang.online
 *   ALIYUN_DM_FROM_ALIAS      发件人显示名, 如 "漫想"
 */

import Dm20151123, * as $Dm20151123 from '@alicloud/dm20151123';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

let _client: Dm20151123 | null = null;
function getClient(): Dm20151123 | null {
  if (_client) return _client;
  const id = process.env.ALIYUN_DM_ACCESS_KEY_ID;
  const secret = process.env.ALIYUN_DM_ACCESS_KEY_SECRET;
  if (!id || !secret || id.startsWith('你的') || id.length < 10) {
    return null;
  }
  const config = new $OpenApi.Config({ accessKeyId: id, accessKeySecret: secret });
  // 公网 endpoint (国内华东 1 / 杭州)。如改用其他区域请同步改这里
  config.endpoint = 'dm.aliyuncs.com';
  _client = new Dm20151123(config);
  return _client;
}

/** 发送一封文本+HTML 邮件 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true; envId: string } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: '邮件服务未配置 (ALIYUN_DM_ACCESS_KEY_ID 缺失)' };
  }
  const from = process.env.ALIYUN_DM_FROM_ADDRESS;
  const alias = process.env.ALIYUN_DM_FROM_ALIAS || '漫想';
  if (!from) return { ok: false, error: 'ALIYUN_DM_FROM_ADDRESS 未配置' };

  const req = new $Dm20151123.SingleSendMailRequest({
    accountName: from,
    fromAlias: alias,
    addressType: 1,        // 1 = 发信地址使用控制台已创建的(必须 DNS 已验证)
    replyToAddress: false, // 不需要回信
    toAddress: opts.to,
    subject: opts.subject,
    htmlBody: opts.html,
    textBody: opts.text || opts.html.replace(/<[^>]+>/g, '')
  });
  try {
    const runtime = new $Util.RuntimeOptions({});
    const resp = await client.singleSendMailWithOptions(req, runtime);
    return { ok: true, envId: resp?.body?.envId ?? '' };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; data?: { Message?: string } };
    const msg = e?.data?.Message || e?.message || String(err);
    console.error('[email] 发送失败:', msg);
    return { ok: false, error: msg };
  }
}

/** 生成验证码邮件 HTML (统一模板) */
export function verificationEmailHtml(code: string, purpose: 'bind' | 'reset'): { subject: string; html: string } {
  const purposeText = purpose === 'bind' ? '绑定邮箱' : '重置密码';
  return {
    subject: `【漫想】${purposeText}验证码 ${code}`,
    html: `
      <div style="font-family: -apple-system, 'PingFang SC', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FAF6EE;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-grid; place-items: center; width: 48px; height: 48px; border: 2.5px solid #C0392B; border-radius: 4px;">
            <span style="font-size: 24px; font-weight: 900; color: #C0392B;">漫</span>
          </div>
        </div>
        <h2 style="font-size: 20px; color: #1A1614; margin: 0 0 12px; text-align: center;">${purposeText}验证码</h2>
        <p style="font-size: 14px; color: #4A4540; line-height: 1.8; margin: 0 0 24px;">
          您正在${purposeText}。请在 10 分钟内输入下方验证码完成操作:
        </p>
        <div style="background: #FFFFFF; border: 1.5px solid #1A1614; border-radius: 6px; padding: 20px; text-align: center; box-shadow: 4px 4px 0 0 #1A1614; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #C0392B; font-family: 'JetBrains Mono', monospace;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #8A8275; line-height: 1.7; margin: 24px 0 0;">
          如果这不是你本人的操作，请忽略此邮件。<br>
          漫想团队 · manxiang.online
        </p>
      </div>
    `.trim()
  };
}
