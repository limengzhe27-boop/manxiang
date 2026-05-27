'use client';

/**
 * 漫画分镜手绘 SVG 占位图
 * 每个分镜是一个手绘风格的场景描述，墨线 stroke
 */

type PanelArtProps = { kind: string; className?: string };

export function PanelArt({ kind, className }: PanelArtProps) {
  const art = ARTS[kind] ?? ARTS.silhouette;
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        <pattern id={`hatch-${kind}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" strokeWidth="0.6" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="var(--surface)" />
      <rect width="400" height="300" fill={`url(#hatch-${kind})`} />
      {art()}
    </svg>
  );
}

const stroke = { stroke: 'var(--ink)', strokeWidth: 1.6, fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const ARTS: Record<string, () => JSX.Element> = {
  /** 雨夜·撑刀人剪影 */
  rainNight: () => (
    <g>
      {/* 雨水斜线 */}
      {Array.from({ length: 28 }).map((_, i) => (
        <line key={i} x1={20 + i * 14} y1={-10} x2={-20 + i * 14} y2={80} stroke="var(--ink)" strokeWidth="0.5" opacity="0.5" />
      ))}
      {/* 远景建筑 */}
      <path d="M 0 200 L 60 200 L 60 130 L 90 130 L 90 200 L 140 200 L 140 110 L 180 110 L 180 200 L 240 200 L 240 145 L 280 145 L 280 200 L 400 200" {...stroke} fill="var(--bg-warm)" />
      {/* 地面 */}
      <line x1="0" y1="230" x2="400" y2="230" {...stroke} strokeWidth="2" />
      {/* 人物剪影 中央 */}
      <path d="M 195 230 L 195 165 Q 195 155 200 155 Q 205 155 205 165 L 205 175 L 215 195 L 213 200 L 207 192 L 207 230 Z" {...stroke} fill="var(--ink)" />
      {/* 头部 */}
      <circle cx="200" cy="148" r="9" {...stroke} fill="var(--ink)" />
      {/* 匕首高光 */}
      <line x1="216" y1="190" x2="228" y2="178" {...stroke} strokeWidth="2.2" />
      {/* 倒地目标 */}
      <ellipse cx="290" cy="228" rx="32" ry="5" {...stroke} fill="var(--ink-tertiary)" opacity="0.55" />
      <path d="M 260 226 Q 290 220 320 226" {...stroke} />
    </g>
  ),

  /** 近景手·匕首 */
  closeBlade: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--bg-warm)" />
      {/* 大特写匕首 */}
      <path d="M 120 250 L 140 230 L 220 80 L 240 100 L 160 240 L 145 260 Z" {...stroke} strokeWidth="2" fill="var(--surface)" />
      {/* 刀刃高光 */}
      <line x1="155" y1="220" x2="225" y2="100" stroke="var(--ink)" strokeWidth="0.6" />
      {/* 手部 */}
      <path d="M 80 280 Q 95 250 130 245 Q 150 244 150 260 L 145 270 Q 138 285 120 285 L 85 285 Z" {...stroke} fill="var(--surface)" />
      <path d="M 100 270 L 130 268" {...stroke} strokeWidth="0.8" />
      {/* 血滴 朱砂红 */}
      <circle cx="230" cy="115" r="4" fill="var(--red)" />
      <circle cx="245" cy="135" r="2.5" fill="var(--red)" />
    </g>
  ),

  /** 项链特写 */
  necklace: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--surface)" />
      {/* 项链链条曲线 */}
      <path d="M 60 60 Q 200 100 340 60" {...stroke} strokeDasharray="2 4" />
      <path d="M 80 80 Q 200 200 320 80" {...stroke} />
      {/* 吊坠 */}
      <circle cx="200" cy="170" r="28" {...stroke} strokeWidth="2.2" fill="var(--bg-warm)" />
      <text x="200" y="180" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="24" fontWeight="900" fill="var(--red)">忘</text>
      {/* 周边阴影 */}
      <ellipse cx="200" cy="220" rx="80" ry="8" fill="var(--ink)" opacity="0.15" />
      {/* 装饰光线 */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <line key={i} x1="200" y1="170" x2={200 + Math.cos(deg * Math.PI / 180) * 60} y2={170 + Math.sin(deg * Math.PI / 180) * 60} stroke="var(--ink)" strokeWidth="0.5" opacity="0.3" />
      ))}
    </g>
  ),

  /** 双人对峙 */
  duel: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--bg-warm)" />
      {/* 月亮 */}
      <circle cx="340" cy="60" r="26" {...stroke} fill="var(--surface)" />
      <circle cx="332" cy="55" r="6" fill="var(--surface-alt)" />
      {/* 地平线 */}
      <line x1="0" y1="220" x2="400" y2="220" {...stroke} strokeWidth="2" />
      {/* 左人 */}
      <circle cx="110" cy="155" r="11" {...stroke} fill="var(--ink)" />
      <path d="M 110 166 L 110 215 M 95 200 L 110 180 L 130 195 M 110 215 L 96 250 M 110 215 L 124 250" {...stroke} strokeWidth="2.5" />
      <line x1="130" y1="195" x2="160" y2="170" {...stroke} strokeWidth="2.5" />
      {/* 右人 */}
      <circle cx="290" cy="155" r="11" {...stroke} fill="var(--surface)" />
      <path d="M 290 166 L 290 215 M 305 200 L 290 180 L 270 195 M 290 215 L 304 250 M 290 215 L 276 250" {...stroke} strokeWidth="2.5" />
      <line x1="270" y1="195" x2="240" y2="170" {...stroke} strokeWidth="2.5" />
      {/* 中间张力 */}
      <line x1="165" y1="170" x2="235" y2="170" stroke="var(--red)" strokeWidth="1" strokeDasharray="3 4" />
    </g>
  ),

  /** 王宫剪影 */
  palace: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--bg)" />
      {/* 天空云 */}
      <path d="M 30 50 Q 60 30 90 50 Q 120 30 150 50" {...stroke} strokeWidth="1" opacity="0.5" />
      <path d="M 220 70 Q 250 50 280 70 Q 310 50 340 70" {...stroke} strokeWidth="1" opacity="0.5" />
      {/* 宫殿剪影 */}
      <path d="M 0 240 L 50 240 L 60 210 L 70 240 L 110 240 L 110 180 L 130 160 L 180 110 L 230 160 L 250 180 L 250 240 L 290 240 L 300 210 L 310 240 L 400 240 L 400 280 L 0 280 Z" {...stroke} fill="var(--ink)" />
      {/* 屋顶飞檐 */}
      <line x1="170" y1="135" x2="190" y2="135" {...stroke} strokeWidth="2" />
      <line x1="155" y1="155" x2="205" y2="155" {...stroke} strokeWidth="2" />
      {/* 窗户灯光 */}
      <rect x="170" y="175" width="20" height="12" fill="var(--red)" opacity="0.85" />
      <rect x="120" y="200" width="8" height="14" fill="var(--warning)" opacity="0.7" />
      <rect x="232" y="200" width="8" height="14" fill="var(--warning)" opacity="0.7" />
    </g>
  ),

  /** 革命旗帜 */
  flag: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--bg-warm)" />
      {/* 远景人群剪影 */}
      <path d="M 0 240 Q 20 230 30 240 Q 50 228 70 240 Q 90 232 110 240 Q 130 230 150 240 Q 170 234 190 240 Q 210 230 230 240 Q 260 234 280 240 Q 310 230 340 240 Q 370 232 400 240 L 400 280 L 0 280 Z" {...stroke} fill="var(--ink)" />
      {/* 旗杆 */}
      <line x1="200" y1="280" x2="200" y2="60" {...stroke} strokeWidth="3" />
      {/* 旗帜 朱砂红 */}
      <path d="M 200 60 L 320 75 L 305 110 L 320 145 L 200 130 Z" {...stroke} fill="var(--red)" strokeWidth="2" />
      {/* 旗帜上的字 */}
      <text x="245" y="108" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="22" fontWeight="900" fill="var(--bg)">破</text>
      {/* 火把 */}
      <circle cx="80" cy="220" r="8" fill="var(--warning)" />
      <circle cx="340" cy="225" r="6" fill="var(--warning)" />
    </g>
  ),

  /** 公主 */
  princess: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--surface)" />
      {/* 镜子框 */}
      <ellipse cx="200" cy="150" rx="110" ry="135" {...stroke} strokeWidth="3" fill="var(--bg-warm)" />
      <ellipse cx="200" cy="150" rx="100" ry="125" {...stroke} fill="none" strokeWidth="0.6" strokeDasharray="2 3" />
      {/* 公主肖像 */}
      <circle cx="200" cy="120" r="32" {...stroke} fill="var(--bg)" />
      {/* 头饰 */}
      <path d="M 168 110 L 175 80 L 185 100 L 200 70 L 215 100 L 225 80 L 232 110 Z" {...stroke} fill="var(--warning)" />
      {/* 头发 */}
      <path d="M 170 130 Q 170 170 200 175 Q 230 170 230 130" {...stroke} fill="var(--ink)" />
      {/* 衣领 */}
      <path d="M 160 200 Q 200 165 240 200 L 240 245 L 160 245 Z" {...stroke} fill="var(--red)" />
      {/* 项链珠子 */}
      <circle cx="185" cy="210" r="3" fill="var(--warning)" />
      <circle cx="200" cy="216" r="3.5" fill="var(--warning)" />
      <circle cx="215" cy="210" r="3" fill="var(--warning)" />
      {/* 眼睛 */}
      <line x1="187" y1="120" x2="194" y2="120" {...stroke} strokeWidth="2" />
      <line x1="206" y1="120" x2="213" y2="120" {...stroke} strokeWidth="2" />
    </g>
  ),

  /** 平民装束 */
  disguise: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--bg)" />
      {/* 镜子 */}
      <rect x="80" y="40" width="240" height="220" rx="4" {...stroke} strokeWidth="3" fill="var(--bg-warm)" />
      {/* 倒影 */}
      <circle cx="200" cy="130" r="30" {...stroke} fill="var(--surface)" />
      <path d="M 170 130 Q 200 110 230 130" {...stroke} />
      <path d="M 160 200 Q 200 170 240 200 L 240 250 L 160 250 Z" {...stroke} fill="var(--surface-alt)" />
      {/* 帽子 */}
      <path d="M 170 105 Q 200 90 230 105 L 240 110 L 160 110 Z" {...stroke} fill="var(--ink)" />
      {/* 包袱 */}
      <path d="M 250 240 Q 270 220 290 240 Q 290 270 270 270 Q 250 270 250 240 Z" {...stroke} fill="var(--surface-alt)" />
      {/* 旁边 桌上 王冠 */}
      <path d="M 50 250 L 70 250 L 75 240 L 80 250 L 85 240 L 90 250 L 95 240 L 100 250 L 110 250" {...stroke} strokeWidth="2" fill="var(--warning)" opacity="0.85" />
    </g>
  ),

  /** 深海水下 */
  deepSea: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--indigo)" opacity="0.85" />
      <rect x="0" y="0" width="400" height="300" fill="var(--ink)" opacity="0.35" />
      {/* 光柱 */}
      <path d="M 60 0 L 100 0 L 130 300 L 50 300 Z" fill="var(--bg)" opacity="0.07" />
      <path d="M 220 0 L 270 0 L 310 300 L 200 300 Z" fill="var(--bg)" opacity="0.05" />
      {/* 气泡 */}
      <circle cx="80" cy="200" r="6" stroke="var(--bg)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="100" cy="170" r="3" stroke="var(--bg)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="320" cy="220" r="4" stroke="var(--bg)" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* 城市轮廓 中央 */}
      <path d="M 100 280 L 100 230 L 130 230 L 130 200 L 160 200 L 160 170 L 180 145 L 200 170 L 200 130 L 220 110 L 240 130 L 240 175 L 260 175 L 260 210 L 290 210 L 290 245 L 320 245 L 320 280 Z" stroke="var(--bg)" strokeWidth="1.4" fill="var(--ink)" opacity="0.95" />
      {/* 窗 微光 */}
      <rect x="115" y="245" width="6" height="6" fill="var(--warning)" opacity="0.9" />
      <rect x="170" y="220" width="6" height="6" fill="var(--warning)" opacity="0.9" />
      <rect x="195" y="190" width="6" height="6" fill="var(--warning)" opacity="0.9" />
      <rect x="225" y="155" width="6" height="6" fill="var(--warning)" opacity="0.9" />
      <rect x="270" y="225" width="6" height="6" fill="var(--warning)" opacity="0.9" />
    </g>
  ),

  /** 潜水员 */
  diver: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--indigo)" />
      <rect x="0" y="0" width="400" height="300" fill="var(--ink)" opacity="0.3" />
      {/* 气泡 */}
      <circle cx="50" cy="180" r="4" stroke="var(--bg)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="75" cy="140" r="3" stroke="var(--bg)" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* 潜水员 */}
      <ellipse cx="200" cy="170" rx="32" ry="40" stroke="var(--bg)" strokeWidth="1.4" fill="var(--surface-alt)" />
      {/* 头盔玻璃 */}
      <ellipse cx="200" cy="160" rx="24" ry="28" fill="var(--bg)" opacity="0.85" />
      <ellipse cx="190" cy="150" rx="6" ry="3" fill="var(--bg)" />
      {/* 身体 */}
      <path d="M 175 205 L 175 270 L 225 270 L 225 205" stroke="var(--bg)" strokeWidth="1.4" fill="var(--ink-secondary)" />
      {/* 氧气管 */}
      <path d="M 220 180 Q 280 200 290 250" stroke="var(--bg)" strokeWidth="2" fill="none" />
      {/* 手电筒光 */}
      <path d="M 250 170 L 380 80 L 380 110 L 250 200 Z" fill="var(--warning)" opacity="0.18" />
    </g>
  ),

  /** 通用 silhouette fallback */
  silhouette: () => (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="var(--surface)" />
      <line x1="0" y1="220" x2="400" y2="220" {...stroke} strokeWidth="2" />
      <circle cx="200" cy="150" r="14" {...stroke} fill="var(--ink)" />
      <path d="M 200 164 L 200 215 M 180 195 L 200 180 L 220 195 M 200 215 L 184 250 M 200 215 L 216 250" {...stroke} strokeWidth="2.5" />
      <ellipse cx="200" cy="270" rx="80" ry="6" fill="var(--ink)" opacity="0.15" />
    </g>
  )
};
