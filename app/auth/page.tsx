'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Copy, ClipboardCheck, KeyRound, Loader2, Lock, LogIn } from 'lucide-react';
import { StampLogo } from '@/components/StampLogo';
import { Magnet } from '@/components/Magnet';
import { FloatingStamps } from '@/components/FloatingStamps';
import { getDeviceId, setDeviceId, setAuthed, apiFetch } from '@/lib/identity';

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/settings';

  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState(false); // 当前账号是否已设密码
  const [nickname, setNickname] = useState('漫想者');

  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [nick, setNick] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [myCode, setMyCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreBusy, setRestoreBusy] = useState(false);

  useEffect(() => {
    setMyCode(getDeviceId());
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        const data = await res.json();
        if (res.ok && data.user) {
          setActivated(!!data.user.activated);
          setNickname(data.user.nickname);
        }
      } catch {
        /* 忽略 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const register = async () => {
    setError('');
    if (pwd.length < 6) return setError('密码至少 6 位');
    if (pwd !== pwd2) return setError('两次输入的密码不一致');
    setBusy(true);
    try {
      const res = await apiFetch('/api/me/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', nickname: nick.trim() || undefined, password: pwd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '注册失败');
      setAuthed();
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
      setBusy(false);
    }
  };

  const login = async () => {
    setError('');
    if (!pwd) return setError('请输入密码');
    setBusy(true);
    try {
      const res = await apiFetch('/api/me/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', password: pwd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '登录失败');
      setAuthed();
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 忽略 */
    }
  };

  const restore = async () => {
    const code = restoreCode.trim();
    if (!code) return setError('请输入找回码');
    if (code === myCode) return setError('这就是本机的找回码');
    setRestoreBusy(true);
    setError('');
    try {
      const res = await fetch('/api/me/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '恢复失败');
      setDeviceId(code);
      // 切换身份后回到本页重新判断 登录/注册
      window.location.href = '/auth?next=' + encodeURIComponent(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
      setRestoreBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FloatingStamps />

      <header className="container-page pt-8 flex items-center justify-between relative z-10">
        <StampLogo />
        <Link href="/" className="btn-text text-ink-tertiary border-ink-tertiary">← 返回首页</Link>
      </header>

      <div className="container-narrow pt-10 md:pt-14 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <span className="eyebrow">ACCOUNT · 账号</span>
          <h1 className="mt-3 font-serif font-black text-[34px] md:text-[48px] leading-tight tracking-tight text-ink">
            {activated ? '欢迎回来' : '创建你的账号'}
          </h1>
          <p className="mt-4 font-serif text-[15px] leading-[1.85] text-ink-secondary max-w-lg">
            {activated ? (
              <>
                账号 <span className="font-bold text-ink">{nickname}</span> 已设密码，
                请输入密码进入个人中心。创作和浏览无需登录。
              </>
            ) : (
              <>
                你已经可以<span className="hl">免登录创作</span>。设置一个密码后，
                就能保护「个人中心」和「我的故事书」不被本机其他人查看。
              </>
            )}
          </p>
        </motion.div>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-ink-tertiary font-serif">
            <Loader2 size={16} className="animate-spin" /> 加载中…
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-8 rounded-lg border-[1.5px] border-ink bg-surface p-6 md:p-8 max-w-md"
            style={{ boxShadow: '6px 6px 0 0 var(--ink)' }}
          >
            {activated ? (
              // ===== 登录 =====
              <>
                <div className="flex items-center gap-2 mb-4">
                  <LogIn size={16} className="text-red" />
                  <span className="eyebrow">登录</span>
                </div>
                <label className="block mb-3">
                  <span className="eyebrow block mb-2">密码</span>
                  <input
                    type="password"
                    value={pwd}
                    onChange={(e) => { setPwd(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && login()}
                    placeholder="输入访问密码"
                    className="w-full h-12 px-4 rounded border-[1.5px] border-ink bg-bg font-sans text-[15px] text-ink focus:outline-none focus:border-red transition-colors"
                  />
                </label>
                {error && <p className="mb-3 font-serif text-[13px] text-red">⚠ {error}</p>}
                <Magnet>
                  <button onClick={login} disabled={busy} className="btn-primary w-full">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : '登录'}
                  </button>
                </Magnet>
              </>
            ) : (
              // ===== 注册 / 设密码 =====
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={16} className="text-red" />
                  <span className="eyebrow">设置账号密码</span>
                </div>
                <label className="block mb-3">
                  <span className="eyebrow block mb-2">昵称（可选）</span>
                  <input
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    maxLength={16}
                    placeholder={nickname}
                    className="w-full h-12 px-4 rounded border-[1.5px] border-ink bg-bg font-sans text-[15px] text-ink focus:outline-none focus:border-red transition-colors"
                  />
                </label>
                <label className="block mb-3">
                  <span className="eyebrow block mb-2">密码（≥6 位）</span>
                  <input
                    type="password"
                    value={pwd}
                    onChange={(e) => { setPwd(e.target.value); setError(''); }}
                    className="w-full h-12 px-4 rounded border-[1.5px] border-ink bg-bg font-sans text-[15px] text-ink focus:outline-none focus:border-red transition-colors"
                  />
                </label>
                <label className="block mb-3">
                  <span className="eyebrow block mb-2">确认密码</span>
                  <input
                    type="password"
                    value={pwd2}
                    onChange={(e) => { setPwd2(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && register()}
                    className="w-full h-12 px-4 rounded border-[1.5px] border-ink bg-bg font-sans text-[15px] text-ink focus:outline-none focus:border-red transition-colors"
                  />
                </label>
                {error && <p className="mb-3 font-serif text-[13px] text-red">⚠ {error}</p>}
                <Magnet>
                  <button onClick={register} disabled={busy} className="btn-primary w-full">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : '创建账号并进入'}
                  </button>
                </Magnet>
              </>
            )}
          </motion.div>
        )}

        {/* 找回码区 (跨设备) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-lg border-[1.5px] border-border-soft bg-bg-warm/40 p-5 md:p-6 max-w-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={15} className="text-ink-secondary" />
            <span className="eyebrow">跨设备 · 找回码</span>
          </div>
          <p className="font-serif text-[12.5px] text-ink-secondary mb-3">
            复制这串码，在新设备粘贴即可把账号搬过去（到新设备后用密码登录）。
          </p>
          <div className="flex items-stretch gap-2 mb-3">
            <code className="flex-1 flex items-center px-3 rounded border border-ink bg-bg font-mono text-[12px] text-ink break-all">
              {myCode || '…'}
            </code>
            <button onClick={copyCode} className="btn-ghost px-3 whitespace-nowrap text-[13px]">
              {copied ? <ClipboardCheck size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <div className="flex items-stretch gap-2">
            <input
              value={restoreCode}
              onChange={(e) => { setRestoreCode(e.target.value); setError(''); }}
              placeholder="粘贴其他设备的找回码"
              className="flex-1 h-10 px-3 rounded border border-ink bg-bg font-mono text-[12px] text-ink focus:outline-none focus:border-red"
            />
            <button onClick={restore} disabled={restoreBusy || !restoreCode.trim()} className="btn-ghost px-3 text-[13px] disabled:opacity-50">
              {restoreBusy ? <Loader2 size={14} className="animate-spin" /> : '恢复'}
            </button>
          </div>
        </motion.div>

        <p className="mt-6 max-w-md font-sans text-[11px] leading-[1.7] text-ink-tertiary">
          使用即代表同意 <Link href="/terms" className="underline hover:text-ink">《用户协议》</Link> 与{' '}
          <Link href="/privacy" className="underline hover:text-ink">《隐私政策》</Link>。
        </p>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-ink-secondary">加载中…</div>}>
      <AuthInner />
    </Suspense>
  );
}
