import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border-soft">
      <div className="container-page py-8">
        {/* 作品说明条 */}
        <div className="mb-6 flex items-start gap-2 rounded border border-border-soft bg-bg-warm/50 p-3.5">
          <BookOpenCheck size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-secondary" />
          <p className="font-serif text-[13px] leading-[1.7] text-ink-secondary">
            <span className="font-bold text-ink">作品说明</span>：你创作的故事会保存到「我的故事书」。
            平台会在必要范围内对作品进行保存、呈现与体验优化；你可随时管理或删除作品。
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-sm border-[1.5px] border-red font-serif text-[12px] font-bold text-red">
              漫
            </div>
            <span className="font-serif text-sm font-medium text-ink">漫想 Manxiang</span>
            <span className="text-xs text-ink-tertiary">© 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-tertiary">
            <Link className="hover:text-ink transition-colors" href="/about">关于</Link>
            <a className="hover:text-ink transition-colors" href="mailto:3560056610@qq.com">联系</a>
            <Link className="hover:text-ink transition-colors" href="/privacy">隐私</Link>
            <Link className="hover:text-ink transition-colors" href="/terms">用户协议</Link>
          </div>
          <p className="text-[11px] tracking-wide text-ink-tertiary">
            有想法？发邮件到{' '}
            <a
              className="text-ink hover:text-red transition-colors"
              href="mailto:3560056610@qq.com"
            >
              3560056610@qq.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
