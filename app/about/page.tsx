import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: '关于漫想 · Manxiang',
  description: '漫想是一款 AI 驱动的小说与漫画一体化创作平台。'
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="ABOUT · 关于漫想"
      title="用漫画，实现你的想象"
      intro="漫想是一款 AI 驱动的小说与漫画一体化创作平台。你输入一个故事想法，AI 同步生成配套的小说文字与漫画分镜。你通过选择剧情走向掌控故事发展，AI 负责全程执行。"
      sections={[
        {
          heading: '我们相信什么',
          paragraphs: [
            '每个人心里都藏着一个故事，但不是每个人都有时间或能力把它写出来、画出来。',
            '漫想的理念是：你是故事的掌控者，AI 是你的执行团队。你给方向，它负责把脑海里的画面变成现实。'
          ]
        },
        {
          heading: '漫想能做什么',
          paragraphs: [
            '从一句话的故事种子或你自己的想法出发，AI 生成 300-500 字的小说文字，并同步绘制对应的漫画分镜。',
            '每话结束后，你从几个剧情走向里做出选择，故事据此继续向前推进——每一次选择，都是你在真实地掌控这个故事。',
            '满意的作品可以一键导出为竖版长图，分享到小红书、微博、朋友圈。'
          ]
        },
        {
          heading: '关于"漫想"这个名字',
          paragraphs: [
            '漫，是漫画，是视觉化的故事呈现；想，是想象，是你脑海中的故事世界。',
            '合在一起：用漫画实现你的想象。'
          ]
        },
        {
          heading: '现在处于什么阶段',
          paragraphs: [
            '漫想正处于早期产品打磨阶段。文字由大语言模型生成，分镜由文生图模型生成，效果会随模型与提示词持续优化。',
            '你的每一条反馈都很重要，欢迎通过页面底部的邮箱联系我们。'
          ]
        }
      ]}
    />
  );
}
