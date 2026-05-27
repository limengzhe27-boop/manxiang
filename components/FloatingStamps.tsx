'use client';

import { motion } from 'framer-motion';

/** Hero 区背景漂浮的三枚朱砂印章 视差装饰 */
export function FloatingStamps() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-10 top-24 opacity-[0.08]"
        animate={{ rotate: [0, 8, 0], y: [0, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <StampSvg size={180} word="想" />
      </motion.div>

      <motion.div
        className="absolute right-8 top-40 opacity-[0.10]"
        animate={{ rotate: [-3, 6, -3], y: [0, -6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <StampSvg size={120} word="漫" />
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-1/3 opacity-[0.07]"
        animate={{ rotate: [2, -4, 2], y: [0, 5, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      >
        <StampSvg size={140} word="掌" />
      </motion.div>
    </div>
  );
}

function StampSvg({ size, word }: { size: number; word: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="4"
        fill="none"
        stroke="var(--red)"
        strokeWidth="6"
      />
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily="var(--font-serif), Noto Serif SC, serif"
        fontSize="62"
        fontWeight="900"
        fill="var(--red)"
      >
        {word}
      </text>
    </svg>
  );
}
