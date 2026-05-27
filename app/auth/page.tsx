'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Copy, ClipboardCheck, KeyRound, Loader2 } from 'lucide-react';
import { StampLogo } from '@/components/StampLogo';
import { Magnet } from '@/components/Magnet';
import { FloatingStamps } from '@/components/FloatingStamps';
import { getDeviceId, setDeviceId, apiFetch } from '@/lib/identity';

export default function AuthPage() {
  const router = useRouter();
  const [myCode, setMyCode] = useState('');
  const [nickname, setNickname] = useState('漫想者');
  const [copied, setCopied] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 加载本机找回码 + 当前账号昵称
  useEffect(() => {
    setMyCode(getDeviceId());
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        const data = await res.json();
        if (res.ok && data.user) setNickname(data.user.nickname);
      } catch {
        /* 忽略 */
      }
    })();
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('复制失败，请手动选中复制');
    }
  };

  const restore = async () => {
    const code = restoreCode.trim();
    if (!code) return setError('请输入找回码');
    if (code === myCode) return setError('这就是本机的找回码，无需恢复');
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/me/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '恢复失败');
      // 切换本机身份为该找回码
      setDeviceId(code);
      router.push('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FloatingStamps />

      <header className="container-page pt-8 flex items-center justify-between relative z-10">
        <StampLogo />
        <Link href="/" className="btn-text text-ink-tertiary border-ink-tertiary">← 返回首页</Link>
      </header>

      <div className="container-narrow pt-12 md:pt-16 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <span className="eyebrow">ACCOUNT · 账号与找回</span>
          <h1 className="mt-3 font-serif font-black text-[36px] md:text-[52px] leading-tight tracking-tight text-ink">
            让你的故事，<br />
            <span className="stamp-word">永远</span>留在你这里
          </h1>
          <p className="mt-5 font-serif text-[15px] md:text-[16px] leading-[1.85] text-ink-secondary max-w-lg">
            你无需注册即可创作。系统已为你建立一个<span className="hl">匿名账号</span>，故事和设置都已云端保存。
            想在<span className="font-bold text-ink">其他设备继续</span>，只需复制下面的「找回码」，在新设备粘贴即可。
          </p>
        </motion.div>

        {/* 我的找回码 */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-10 rounded-lg border-[1.5px] border-ink bg-surface p-6 md:p-8 max-w-lg"
          style={{ boxShadow: '6px 6px 0 0 var(--ink)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={16} className="text-red" />
            <span className="eyebrow">我的找回码</span>
          </div>
          <p className="font-serif text-[13px] text-ink-secondary mb-4">
            当前账号：<span className="font-bold text-ink">{nickname}</span> · 请妥善保管这串码，它能恢复你的全部数据
          </p>

          <div className="flex items-stretch gap-2">
            <code className="flex-1 flex items-center px-4 rounded border-[1.5px] border-ink bg-bg-warm font-mono text-[14px] tracking-wide text-ink break-all">
              {myCode || '加载中…'}
            </code>
            <Magnet strength={0.2}>
              <button
                onClick={copyCode}
                className="btn-primary h-full px-5 whitespace-nowrap"
              >
                {copied ? (
                  <><ClipboardCheck size={16} /> 已复制</>
                ) : (
                  <><Copy size={16} /> 复制</>
                )}
              </button>
            </Magnet>
          </div>
        </motion.div>

        {/* 用找回码恢复账号 */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-6 rounded-lg border-[1.5px] border-border-soft bg-bg-warm/40 p-6 md:p-8 max-w-lg"
        >
          <span className="eyebrow block mb-2">在新设备恢复账号</span>
          <p className="font-serif text-[13px] text-ink-secondary mb-4">
            把另一台设备的找回码粘贴到这里，本设备会切换到那个账号。
          </p>
          <div className="flex items-stretch gap-2">
            <input
              value={restoreCode}
              onChange={(e) => {
                setRestoreCode(e.target.value);
                setError('');
              }}
              placeholder="粘贴找回码，如 dev_xxxxx"
              className="flex-1 h-12 px-4 rounded border-[1.5px] border-ink bg-bg font-mono text-[14px] text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-red transition-colors"
            />
            <button
              onClick={restore}
              disabled={busy || !restoreCode.trim()}
              className="btn-ghost h-12 px-5 whitespace-nowrap disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : '恢复'}
            </button>
          </div>
          {error && <p className="mt-3 font-serif text-[13px] text-red">⚠ {error}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 max-w-lg"
        >
          <p className="text-sm text-ink-tertiary">
            想直接开始？<Link href="/" className="btn-text">回首页创作 →</Link>
            <span className="mx-2">·</span>
            <Link href="/library" className="btn-text">我的故事书 →</Link>
          </p>
          <p className="mt-4 font-sans text-[11px] leading-[1.7] text-ink-tertiary">
            使用即代表同意 <Link href="/terms" className="underline hover:text-ink">《用户协议》</Link> 与{' '}
            <Link href="/privacy" className="underline hover:text-ink">《隐私政策》</Link>。
            手机/邮箱验证码登录将在正式上线时开放。
          </p>
        </motion.div>
      </div>
    </main>
  );
}
