import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

/** 隐私 / 协议 / 关于 等静态内容页的统一书卷式排版 */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Topbar />
      <main className="container-narrow pt-12 md:pt-16 pb-20">
        <Link href="/" className="btn-text text-ink-tertiary border-ink-tertiary">← 返回首页</Link>

        <header className="mt-6 mb-10">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-3 font-serif font-black text-[34px] md:text-[46px] leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {updated && (
            <p className="mt-3 font-mono text-[12px] text-ink-tertiary">最近更新：{updated}</p>
          )}
          {intro && (
            <p className="mt-5 font-serif text-[16px] leading-[1.9] text-ink-secondary">{intro}</p>
          )}
        </header>

        <article className="space-y-9">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-serif text-[20px] md:text-[22px] font-bold text-ink mb-3 flex items-baseline gap-2">
                <span className="font-mono text-[13px] text-red">{String(i + 1).padStart(2, '0')}</span>
                {s.heading}
              </h2>
              <div className="space-y-3 pl-6 border-l-[1.5px] border-border-soft">
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="font-serif text-[15px] leading-[1.95] text-ink-secondary">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <div className="mt-12 rounded border border-border-soft bg-bg-warm/50 p-5">
          <p className="font-serif text-[14px] leading-[1.8] text-ink-secondary">
            有任何疑问，欢迎邮件联系：
            <a href="mailto:3560056610@qq.com" className="font-bold text-ink hover:text-red transition-colors ml-1">
              3560056610@qq.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
