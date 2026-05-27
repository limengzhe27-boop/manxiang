import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-warm': 'var(--bg-warm)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'surface-hover': 'var(--surface-hover)',
        ink: 'var(--ink)',
        'ink-secondary': 'var(--ink-secondary)',
        'ink-tertiary': 'var(--ink-tertiary)',
        'ink-on-red': 'var(--ink-on-red)',
        red: 'var(--red)',
        'red-hover': 'var(--red-hover)',
        'red-soft': 'var(--red-soft)',
        indigo: 'var(--indigo)',
        'indigo-soft': 'var(--indigo-soft)',
        border: 'var(--border)',
        'border-soft': 'var(--border-soft)',
        success: 'var(--success)',
        warning: 'var(--warning)'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Noto Serif SC', 'serif'],
        sans: ['var(--font-sans)', 'Noto Sans SC', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace']
      },
      maxWidth: {
        container: '1280px',
        wide: '1440px',
        narrow: '720px'
      },
      boxShadow: {
        stamp: '4px 4px 0 0 var(--ink)',
        'stamp-lg': '6px 6px 0 0 var(--ink)',
        'stamp-xl': '8px 8px 0 0 var(--ink)',
        'page-edge': '0 8px 0 -2px var(--ink)'
      },
      transitionTimingFunction: {
        manga: 'cubic-bezier(.2,.8,.2,1)'
      }
    }
  },
  plugins: []
};

export default config;
