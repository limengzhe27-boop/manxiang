'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/Modal';
import { Magnet } from '@/components/Magnet';

export function AuthModal({
  open,
  onClose,
  onDone
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [count, setCount] = useState(60);

  const sendCode = () => {
    if (!account) return;
    setSent(true);
    setCount(60);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setSent(false);
          return 60;
        }
        return c - 1;
      });
    }, 1000);
  };

  const submit = () => {
    onDone?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="text-center">
        {/* 印章 logo */}
        <motion.div
          initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: -3, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 160 }}
          className="inline-grid h-16 w-16 place-items-center rounded-sm border-[3px] border-red"
        >
          <span className="font-serif text-[32px] font-black text-red leading-none">漫</span>
        </motion.div>

        <h2 className="mt-5 font-serif text-[26px] font-bold leading-tight text-ink">
          你的第一话故事已生成
        </h2>
        <p className="mt-2 font-serif text-[15px] text-ink-secondary">
          注册账号永久保存，随时继续创作。
        </p>
      </div>

      <div className="mt-7 space-y-3">
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="手机号 / 邮箱"
          className="w-full h-12 px-4 rounded border-[1.5px] border-ink bg-surface font-sans text-[15px] text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-red transition-colors"
        />

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6 位验证码"
            maxLength={6}
            className="flex-1 h-12 px-4 rounded border-[1.5px] border-ink bg-surface font-mono text-[15px] tracking-widest text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-red transition-colors"
          />
          <button
            onClick={sendCode}
            disabled={!account || sent}
            className="h-12 px-4 rounded border-[1.5px] border-ink bg-bg-warm font-sans text-[13px] font-medium text-ink whitespace-nowrap transition-colors hover:bg-ink hover:text-bg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-bg-warm disabled:hover:text-ink"
          >
            {sent ? `${count} s 后重发` : '获取验证码'}
          </button>
        </div>
      </div>

      <div className="mt-7 flex flex-col items-center gap-4">
        <Magnet>
          <button onClick={submit} className="btn-primary w-full sm:w-auto">
            完成注册并继续
          </button>
        </Magnet>
        <button
          onClick={onClose}
          className="later-btn"
          style={{
            padding: '10px 24px',
            color: '#999',
            background: 'transparent',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'color .2s ease'
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#333')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#999')}
        >
          稍后再说 →
        </button>
      </div>

      <p className="mt-5 text-center font-sans text-[11px] leading-[1.6] text-ink-tertiary">
        注册即同意 <a className="underline">《用户协议》</a> 与 <a className="underline">《隐私政策》</a>
      </p>
    </Modal>
  );
}
