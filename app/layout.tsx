import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '漫想 · 让每个人都能轻松掌控一个属于自己的故事',
  description:
    'AI 驱动的小说与漫画一体化创作平台。输入一个故事想法，AI 同步生成配套的小说文字与漫画分镜。',
  keywords: ['AI 创作', '漫画', '小说', '故事生成', '漫想']
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}
