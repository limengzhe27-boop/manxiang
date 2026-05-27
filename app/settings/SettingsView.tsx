'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Mail,
  Phone,
  Shield,
  Sparkles,
  User
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { Magnet } from '@/components/Magnet';
import { Modal } from '@/components/Modal';
import { apiFetch, getDeviceId } from '@/lib/identity';

const NAV = [
  { key: 'profile', label: '账号资料', icon: User },
  { key: 'billing', label: '订阅与计费', icon: CreditCard },
  { key: 'notification', label: '偏好与通知', icon: Bell },
  { key: 'privacy', label: '隐私与安全', icon: Shield }
] as const;

type Plan = 'first' | 'month' | 'year';
type ModalKind = null | 'email' | 'phone' | 'password' | 'delete';

const PLANS: { id: Plan; name: string; price: string; sub: string; highlight?: string }[] = [
  { id: 'first', name: '首月体验', price: '¥19', sub: '仅限新用户首月', highlight: '限时' },
  { id: 'month', name: '月付', price: '¥39', sub: '每日 50 话，按月续费' },
  { id: 'year', name: '年付', price: '¥299', sub: '约 ¥25/月，省 36%', highlight: '推荐' }
];

const CREDIT_PACKS = [
  { name: '轻量补充', credits: 60, price: '¥6', sub: '约 6 话额外生成' },
  { name: '常用加量', credits: 220, price: '¥18', sub: '适合连续创作' },
  { name: '重度创作', credits: 400, price: '¥30', sub: '预留社区阅读' }
];

const FEATURE_TABLE = [
  { label: '每日生成话数', free: '3 话 / 天', pro: '50 话 / 天' },
  { label: '剧情选择方式', free: '预设三选一', pro: '预设 + 自由输入' },
  { label: '漫画画风', free: '日系黑白', pro: '日系黑白 + 更多风格' },
  { label: '生成队列优先级', free: '普通', pro: '优先队列' },
  { label: '故事导出', free: '带品牌角标', pro: '高清无水印' },
  { label: '额外积分', free: '可购买', pro: '会员价加购' }
];

type ProfileState = {
  nickname: string;
  avatar: string;
  phone: string;
  email: string;
};

type PrefState = {
  generationDone: boolean;
  seedUpdates: boolean;
  weeklyPicks: boolean;
  reducedMotion: boolean;
  platformOps: boolean;
  communityVisible: boolean;
  productResearch: boolean;
};

const DEFAULT_PROFILE: ProfileState = {
  nickname: '漫想者',
  avatar: '漫',
  phone: '138 **** 1234',
  email: ''
};

const DEFAULT_PREFS: PrefState = {
  generationDone: true,
  seedUpdates: false,
  weeklyPicks: true,
  reducedMotion: false,
  platformOps: true,
  communityVisible: false,
  productResearch: true
};

/** 服务端 /api/me 返回的用户结构 */
type ApiUser = {
  id: string;
  nickname: string;
  avatarChar: string;
  phone: string;
  email: string;
  plan: 'free' | 'pro';
  planExpiresAt: number | null;
  prefs: PrefState;
  credits: {
    freeDailyLimit: number;
    freeUsedToday: number;
    bonusCredits: number;
    resetDate: string;
  };
};

export function SettingsView() {
  const params = useSearchParams();
  const initialTab = (params.get('tab') as (typeof NAV)[number]['key']) ?? 'profile';
  const [tab, setTab] = useState<(typeof NAV)[number]['key']>(initialTab);
  const [subOpen, setSubOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('year');
  const [modal, setModal] = useState<ModalKind>(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [prefs, setPrefs] = useState<PrefState>(DEFAULT_PREFS);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free');
  const [credits, setCredits] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [usedToday, setUsedToday] = useState(0);

  // 把 API user 映射进各 state
  const applyUser = (u: ApiUser) => {
    setProfile({ nickname: u.nickname, avatar: u.avatarChar, phone: u.phone, email: u.email });
    setPrefs({ ...DEFAULT_PREFS, ...u.prefs });
    setCurrentPlan(u.plan);
    setCredits(u.credits.bonusCredits);
    setDailyLimit(u.credits.freeDailyLimit);
    setUsedToday(u.credits.freeUsedToday);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        const data = await res.json();
        if (res.ok && data.user) applyUser(data.user as ApiUser);
      } catch {
        // 离线兜底: 保持默认值
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  };

  const updateProfile = async (next: ProfileState) => {
    setProfile(next); // 乐观更新
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({
          profile: {
            nickname: next.nickname,
            avatarChar: next.avatar,
            phone: next.phone,
            email: next.email
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '保存失败');
      applyUser(data.user as ApiUser);
      notify('资料已保存');
    } catch (err) {
      notify(err instanceof Error ? err.message : '保存失败');
    }
  };

  const updatePrefs = async (next: PrefState) => {
    setPrefs(next); // 乐观更新
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ prefs: next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '保存失败');
      notify('设置已保存');
    } catch (err) {
      notify(err instanceof Error ? err.message : '保存失败');
    }
  };

  const activatePlan = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/me/billing', {
        method: 'POST',
        body: JSON.stringify({ action: 'activate', planId: selectedPlan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '开通失败');
      applyUser(data.user as ApiUser);
      notify(`已开通 ${PLANS.find((p) => p.id === selectedPlan)?.name}`);
      setSubOpen(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : '开通失败');
    } finally {
      setBusy(false);
    }
  };

  const buyCredits = async (amount: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/me/billing', {
        method: 'POST',
        body: JSON.stringify({ action: 'buyCredits', amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '购买失败');
      applyUser(data.user as ApiUser);
      notify(`已获得 ${amount} 积分`);
    } catch (err) {
      notify(err instanceof Error ? err.message : '购买失败');
    } finally {
      setBusy(false);
    }
  };

  // 登出: 清除本机匿名身份, 下次访问生成全新身份
  const logout = () => {
    try {
      window.localStorage.removeItem('manxiang_device_id');
    } catch {
      /* 忽略 */
    }
    notify('已登出，正在刷新…');
    window.setTimeout(() => (window.location.href = '/'), 900);
  };

  // 注销: 真删账号数据 + 清身份
  const deleteAccount = async () => {
    try {
      await apiFetch('/api/me', { method: 'DELETE' });
    } catch {
      /* 即使失败也清本地身份 */
    }
    try {
      window.localStorage.removeItem('manxiang_device_id');
    } catch {
      /* 忽略 */
    }
    notify('账号已注销，正在跳转…');
    window.setTimeout(() => (window.location.href = '/'), 1000);
  };

  return (
    <>
      <Topbar />

      <main className="container-page pt-12 pb-24">
        <Reveal>
          <span className="eyebrow">SETTINGS</span>
          <h1 className="mt-3 font-serif font-black text-[36px] md:text-[48px] leading-tight tracking-tight text-ink">
            个人设置
          </h1>
          <p className="mt-3 font-serif text-[15px] text-ink-secondary">
            管理资料、权益、通知偏好和作品使用设置。
          </p>
        </Reveal>

        {toast && (
          <div className="fixed right-5 top-20 z-[80] rounded border-[1.5px] border-ink bg-surface px-4 py-2 font-serif text-[14px] text-ink shadow-[3px_3px_0_0_var(--ink)]">
            {toast}
          </div>
        )}

        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <nav className="space-y-1 md:sticky md:top-24 self-start">
            {NAV.map((n) => {
              const Active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setTab(n.key)}
                  className={`flex w-full items-center justify-between px-4 py-3 rounded text-left border-[1.5px] transition-colors ${
                    Active
                      ? 'border-ink bg-ink text-bg'
                      : 'border-transparent text-ink-secondary hover:border-border-soft hover:bg-bg-warm/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 font-sans text-[14px] font-medium">
                    <n.icon size={16} />
                    {n.label}
                  </span>
                  {Active && <ChevronRight size={14} />}
                </button>
              );
            })}
          </nav>

          <div className="space-y-6">
            {tab === 'profile' && (
              <ProfilePanel
                profile={profile}
                onSave={updateProfile}
                onOpenModal={setModal}
              />
            )}
            {tab === 'billing' && (
              <BillingPanel
                credits={credits}
                currentPlan={currentPlan}
                dailyLimit={dailyLimit}
                usedToday={usedToday}
                busy={busy}
                onUpgrade={() => setSubOpen(true)}
                onBuyCredits={buyCredits}
              />
            )}
            {tab === 'notification' && <NotificationPanel prefs={prefs} onChange={updatePrefs} />}
            {tab === 'privacy' && (
              <PrivacyPanel
                prefs={prefs}
                onChange={updatePrefs}
                onOpenModal={setModal}
                onLogout={logout}
              />
            )}
          </div>
        </div>
      </main>

      <SubscribeModal
        open={subOpen}
        selectedPlan={selectedPlan}
        busy={busy}
        onClose={() => setSubOpen(false)}
        onSelect={setSelectedPlan}
        onActivate={activatePlan}
      />

      <AccountModal
        kind={modal}
        profile={profile}
        onClose={() => setModal(null)}
        onSave={(next) => {
          updateProfile(next);
          setModal(null);
        }}
        onDeleteAccount={deleteAccount}
        onNotify={notify}
      />

      <Footer />
    </>
  );
}

function ProfilePanel({
  profile,
  onSave,
  onOpenModal
}: {
  profile: ProfileState;
  onSave: (profile: ProfileState) => void;
  onOpenModal: (kind: ModalKind) => void;
}) {
  const [draft, setDraft] = useState(profile);

  useEffect(() => setDraft(profile), [profile]);

  return (
    <>
      <Section title="基本资料">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-soft pb-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full border-[1.5px] border-ink bg-surface font-serif text-[22px] font-black text-red">
              {draft.avatar.slice(0, 1) || '漫'}
            </div>
            <div>
              <p className="font-serif text-[18px] font-bold text-ink">{draft.nickname || '漫想者'}</p>
              <p className="font-serif text-[12.5px] text-ink-tertiary">创作者主页显示名称</p>
            </div>
          </div>
          <button
            onClick={() => setDraft({ ...draft, avatar: ['漫', '想', '创', '梦'][Math.floor(Math.random() * 4)] })}
            className="btn-text self-start sm:self-auto"
          >
            随机头像
          </button>
        </div>

        <Field label="昵称">
          <input
            value={draft.nickname}
            onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
            maxLength={16}
            className="h-10 w-full rounded border border-border-soft bg-bg px-3 font-serif text-[14px] text-ink focus:outline-none focus:border-red"
          />
        </Field>
        <Field label="头像字">
          <input
            value={draft.avatar}
            onChange={(e) => setDraft({ ...draft, avatar: e.target.value.slice(0, 1) })}
            maxLength={1}
            className="h-10 w-24 rounded border border-border-soft bg-bg px-3 text-center font-serif text-[16px] font-bold text-ink focus:outline-none focus:border-red"
          />
        </Field>
        <div className="flex justify-end pt-2">
          <button onClick={() => onSave(draft)} className="btn-primary">
            保存资料
          </button>
        </div>
      </Section>

      <Section title="登录账号">
        <Row label="手机号" value={profile.phone || '未绑定'} custom={
          <button onClick={() => onOpenModal('phone')} className="btn-text">
            {profile.phone ? '更换' : '去绑定'}
          </button>
        } />
        <Row label="邮箱" value={profile.email || '未绑定'} custom={
          <button onClick={() => onOpenModal('email')} className="btn-text">
            {profile.email ? '更换' : '去绑定'}
          </button>
        } />
      </Section>
    </>
  );
}

function BillingPanel({
  currentPlan,
  credits,
  dailyLimit,
  usedToday,
  busy,
  onUpgrade,
  onBuyCredits
}: {
  currentPlan: 'free' | 'pro';
  credits: number;
  dailyLimit: number;
  usedToday: number;
  busy: boolean;
  onUpgrade: () => void;
  onBuyCredits: (credits: number) => void;
}) {
  const remaining = Math.max(0, dailyLimit - usedToday);

  // 账单流水
  const [txns, setTxns] = useState<Array<{ id: string; amount: number; reason: string; created_at: number }>>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/me/billing');
        const data = await res.json();
        if (res.ok && Array.isArray(data.transactions)) setTxns(data.transactions);
      } catch {
        /* 忽略 */
      }
    })();
    // credits 变化后刷新流水
  }, [credits]);

  const reasonLabel = (r: string) =>
    r === 'purchase' ? '购买积分' : r === 'share_bonus' ? '分享奖励' : r === 'signup' ? '注册赠送' : r;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded border-[1.5px] border-ink bg-bg-warm p-6 overflow-hidden"
        style={{ boxShadow: '4px 4px 0 0 var(--ink)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="tag tag--ghost">CURRENT PLAN</span>
            <h3 className="mt-2 font-serif text-[28px] font-black text-ink">
              {currentPlan === 'pro' ? 'PRO 会员' : '免费用户'}
            </h3>
            <p className="mt-2 font-serif text-[15px] text-ink-secondary">
              今日剩余 <span className="font-bold text-red">{remaining} / {dailyLimit}</span> 话 ·
              积分余额 <span className="font-bold text-ink">{credits}</span>
            </p>
          </div>
          <Magnet>
            <button onClick={onUpgrade} className="btn-primary whitespace-nowrap">
              {currentPlan === 'pro' ? '管理订阅 →' : '升级解锁 PRO →'}
            </button>
          </Magnet>
        </div>

        <div className="mt-5">
          <div className="h-2 bg-bg rounded-full overflow-hidden border border-border-soft">
            <div className="h-full bg-red transition-all" style={{ width: currentPlan === 'pro' ? '100%' : '33%' }} />
          </div>
        </div>
      </motion.div>

      <Section title="权益对比">
        <div className="overflow-hidden rounded border border-border-soft">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-bg-warm">
                <th className="px-4 py-3 font-sans text-[12px] font-medium uppercase tracking-wider text-ink-tertiary">功能</th>
                <th className="px-4 py-3 font-sans text-[12px] font-medium uppercase tracking-wider text-ink-tertiary">免费</th>
                <th className="px-4 py-3 font-sans text-[12px] font-medium uppercase tracking-wider text-red">PRO</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_TABLE.map((r, i) => (
                <tr key={i} className="border-t border-border-soft">
                  <td className="px-4 py-3 font-serif text-[14px] text-ink">{r.label}</td>
                  <td className="px-4 py-3 font-serif text-[13.5px] text-ink-secondary">{r.free}</td>
                  <td className="px-4 py-3 font-serif text-[13.5px] font-bold text-red">{r.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="积分包">
        <div className="grid gap-3 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.name}
              onClick={() => onBuyCredits(pack.credits)}
              disabled={busy}
              className="rounded border-[1.5px] border-ink bg-surface p-4 text-left transition-colors hover:border-red hover:bg-red-soft disabled:opacity-50 disabled:cursor-wait"
            >
              <p className="font-sans text-[12px] font-medium uppercase tracking-wider text-ink-tertiary">{pack.name}</p>
              <p className="mt-1 font-serif text-[28px] font-black text-ink">{pack.price}</p>
              <p className="mt-1 font-serif text-[13px] text-red">{pack.credits} 积分</p>
              <p className="mt-1 font-serif text-[12px] text-ink-secondary">{pack.sub}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="积分流水">
        {txns.length === 0 ? (
          <p className="font-serif text-[14px] text-ink-tertiary">
            还没有积分记录。购买积分包或分享作品后，记录会显示在这里。
          </p>
        ) : (
          <ul className="divide-y divide-border-soft">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-serif text-[14px] text-ink">{reasonLabel(t.reason)}</p>
                  <p className="font-mono text-[11px] text-ink-tertiary">
                    {new Date(t.created_at).toLocaleString('zh-CN', { hour12: false })}
                  </p>
                </div>
                <span className={`font-serif text-[15px] font-bold ${t.amount >= 0 ? 'text-red' : 'text-ink-tertiary'}`}>
                  {t.amount >= 0 ? '+' : ''}{t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function NotificationPanel({ prefs, onChange }: { prefs: PrefState; onChange: (prefs: PrefState) => void }) {
  return (
    <Section title="通知与偏好">
      <Row label="生成完成时通知" custom={<Toggle on={prefs.generationDone} onChange={(v) => onChange({ ...prefs, generationDone: v })} />} />
      <Row label="新故事种子上线提醒" custom={<Toggle on={prefs.seedUpdates} onChange={(v) => onChange({ ...prefs, seedUpdates: v })} />} />
      <Row label="每周热门故事推荐" custom={<Toggle on={prefs.weeklyPicks} onChange={(v) => onChange({ ...prefs, weeklyPicks: v })} />} />
      <Row label="减弱动效（无障碍）" custom={<Toggle on={prefs.reducedMotion} onChange={(v) => onChange({ ...prefs, reducedMotion: v })} />} />
    </Section>
  );
}

function PrivacyPanel({
  prefs,
  onChange,
  onOpenModal,
  onLogout
}: {
  prefs: PrefState;
  onChange: (prefs: PrefState) => void;
  onOpenModal: (kind: ModalKind) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <Section title="作品使用">
        <Row label="允许平台进行必要保存、呈现与运营管理" custom={<Toggle on={prefs.platformOps} onChange={(v) => onChange({ ...prefs, platformOps: v })} />} />
        <Row label="未来社区开放后，允许他人查看我发布的故事" custom={<Toggle on={prefs.communityVisible} onChange={(v) => onChange({ ...prefs, communityVisible: v })} />} />
        <Row label="允许用于产品体验分析" custom={<Toggle on={prefs.productResearch} onChange={(v) => onChange({ ...prefs, productResearch: v })} />} />
      </Section>
      <Section title="账号安全">
        <Row
          label="账号找回码"
          value="复制后可在其他设备恢复账号"
          custom={<a href="/auth" className="btn-text">查看 / 复制</a>}
        />
        <Row label="修改密码" custom={<button onClick={() => onOpenModal('password')} className="btn-text">前往</button>} />
        <Row
          label="登出当前账号"
          value="清除本机身份，下次访问生成新身份"
          custom={<button onClick={onLogout} className="btn-text" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>登出</button>}
        />
        <Row
          label="注销账号"
          value="永久删除账号资料与积分记录"
          custom={<button onClick={() => onOpenModal('delete')} className="btn-text" style={{ color: 'var(--ink-tertiary)' }}>申请</button>}
        />
      </Section>
    </>
  );
}

function SubscribeModal({
  open,
  selectedPlan,
  busy,
  onClose,
  onSelect,
  onActivate
}: {
  open: boolean;
  selectedPlan: Plan;
  busy: boolean;
  onClose: () => void;
  onSelect: (plan: Plan) => void;
  onActivate: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={620}>
      <div className="mb-6 flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-sm border-[2.5px] border-red shrink-0">
          <Sparkles size={18} className="text-red" />
        </div>
        <div>
          <h2 className="font-serif text-[24px] font-bold text-ink leading-tight">解锁漫想 PRO</h2>
          <p className="font-serif text-[14px] text-ink-secondary mt-1">每日 50 话 · 自由剧情 · 优先队列 · 多种画风</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`relative rounded border-[1.5px] p-4 text-left transition-all ${
              selectedPlan === p.id ? 'border-red bg-red-soft' : 'border-ink bg-surface hover:border-red'
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-2 right-3 tag tag--red text-[10px]" style={{ padding: '2px 6px' }}>
                {p.highlight}
              </span>
            )}
            <p className="font-sans text-[12px] font-medium tracking-wider text-ink-secondary uppercase mb-1">{p.name}</p>
            <p className="font-serif text-[28px] font-black text-ink leading-none">{p.price}</p>
            <p className="font-serif text-[12px] text-ink-secondary mt-1.5">{p.sub}</p>
            {selectedPlan === p.id && (
              <div className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-red text-bg">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded border border-border-soft bg-bg-warm/50 p-4 space-y-2.5">
        {['每日 50 话生成额度', '自由输入剧情走向', '优先生成队列', '长图导出无水印', '更多漫画画风陆续开放'].map((t) => (
          <div key={t} className="flex items-start gap-2.5">
            <Check size={14} className="text-red mt-1 shrink-0" />
            <p className="font-serif text-[14px] text-ink">{t}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-sans text-[11px] text-ink-tertiary">当前为演示支付，正式上线后接入微信/支付宝。</p>
        <Magnet>
          <button onClick={onActivate} disabled={busy} className="btn-primary disabled:opacity-60 disabled:cursor-wait">
            {busy ? '开通中…' : `开通 ${PLANS.find((p) => p.id === selectedPlan)?.price}`}
          </button>
        </Magnet>
      </div>
    </Modal>
  );
}

function AccountModal({
  kind,
  profile,
  onClose,
  onSave,
  onDeleteAccount,
  onNotify
}: {
  kind: ModalKind;
  profile: ProfileState;
  onClose: () => void;
  onSave: (profile: ProfileState) => void;
  onDeleteAccount: () => void;
  onNotify: (msg: string) => void;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (kind === 'email') setValue(profile.email);
    if (kind === 'phone') setValue(profile.phone);
    if (kind === 'password' || kind === 'delete') setValue('');
  }, [kind, profile.email, profile.phone]);

  if (!kind) return null;

  const titleMap = {
    email: '绑定邮箱',
    phone: '绑定手机号',
    password: '修改密码',
    delete: '注销账号'
  };

  const submit = () => {
    if (kind === 'email') {
      if (!value.includes('@')) return onNotify('请输入有效邮箱');
      onSave({ ...profile, email: value });
    } else if (kind === 'phone') {
      if (value.replace(/\D/g, '').length < 8) return onNotify('请输入有效手机号');
      onSave({ ...profile, phone: value });
    } else if (kind === 'password') {
      if (value.length < 6) return onNotify('密码至少 6 位');
      onNotify('密码已更新');
      onClose();
    } else if (kind === 'delete') {
      if (value !== '删除账号') return onNotify('请输入“删除账号”确认');
      onClose();
      onDeleteAccount();
    }
  };

  return (
    <Modal open={!!kind} onClose={onClose} maxWidth={460}>
      <h2 className="font-serif text-[24px] font-bold text-ink">{titleMap[kind]}</h2>
      <p className="mt-2 font-serif text-[14px] leading-[1.7] text-ink-secondary">
        {kind === 'delete'
          ? '注销会永久删除你的账号资料、偏好和积分记录，且无法恢复。请输入“删除账号”确认。'
          : kind === 'password'
            ? '当前为匿名设备账号，暂无独立密码。接入登录系统后此处可设置密码。'
            : '绑定信息会保存到你的账号（云端），下次同一设备访问自动恢复。'}
      </p>
      <div className="mt-5">
        <label className="mb-2 block font-sans text-[12px] font-medium uppercase tracking-wider text-ink-tertiary">
          {kind === 'password' ? '新密码' : kind === 'delete' ? '确认文本' : '内容'}
        </label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type={kind === 'password' ? 'password' : 'text'}
          placeholder={kind === 'delete' ? '删除账号' : ''}
          className="h-11 w-full rounded border-[1.5px] border-ink bg-surface px-3 font-serif text-[14px] text-ink focus:outline-none focus:border-red"
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost px-5 py-2.5 text-[14px]">取消</button>
        <button onClick={submit} className="btn-primary px-5 py-2.5 text-[14px]">
          确认
        </button>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="rounded border border-border-soft bg-surface p-6">
        <h2 className="font-serif text-[18px] font-bold text-ink mb-4 pb-3 border-b border-border-soft">{title}</h2>
        <div className="space-y-2">{children}</div>
      </section>
    </Reveal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 py-2.5 sm:grid-cols-[120px_1fr] sm:items-center border-b border-border-soft last:border-b-0">
      <span className="font-sans text-[14px] text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  custom
}: {
  label: string;
  value?: string;
  custom?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border-soft last:border-b-0">
      <span className="font-sans text-[14px] text-ink-secondary">{label}</span>
      <div className="flex items-center gap-3">
        {value && <span className="font-serif text-[14px] text-ink">{value}</span>}
        {custom}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 rounded-full border-[1.5px] border-ink transition-colors ${
        on ? 'bg-red' : 'bg-bg-warm'
      }`}
    >
      <span
        className="absolute top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-bg border border-ink transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </button>
  );
}
