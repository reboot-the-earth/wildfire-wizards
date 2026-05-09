/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#f8fafc',
        surface: {
          0: '#ffffff',
          1: '#f1f5f9',
          2: '#e2e8f0',
          3: '#cbd5e1',
        },
        fire: {
          active: '#dc2626',
          warning: '#d97706',
          spread1: '#ea580c',
          spread2: '#f59e0b',
          spread4: '#ca8a04',
          spread6: '#a16207',
        },
        safe: '#16a34a',
        route: {
          safe: '#16a34a',
          caution: '#ca8a04',
          danger: '#dc2626',
        },
        capacity: {
          open: '#16a34a',
          filling: '#ca8a04',
          critical: '#ea580c',
          full: '#dc2626',
        }
      },
      fontFamily: {
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'countdown': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'countdown-sm': ['1.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      animation: {
        'pulse-urgent': 'pulse-urgent 1.5s ease-in-out infinite',
        'pulse-critical': 'pulse-critical 0.8s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-urgent': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-critical': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.01)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
