/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#08090e',
          secondary: '#0f1018',
          card: '#13151f',
          elevated: '#1a1d2e',
        },
        accent: {
          DEFAULT: '#38bdf8',
          dim: '#0ea5e9',
          muted: '#0369a1',
          glow: 'rgba(56,189,248,0.15)',
        },
        border: {
          DEFAULT: '#1e2235',
          accent: 'rgba(56,189,248,0.3)',
        },
        text: {
          primary: '#f0f9ff',
          secondary: '#94a3b8',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        accent: '0 0 20px rgba(56,189,248,0.15)',
        'accent-lg': '0 0 40px rgba(56,189,248,0.2)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
