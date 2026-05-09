/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Command-center neutrals — used for chrome (sidebars, top bar, map overlays)
        coal: {
          950: '#070a12',
          900: '#0b1020',
          800: '#121a2e',
          700: '#1c2540',
          600: '#27314f',
          500: '#3a4666',
          400: '#5a6585',
          300: '#8e98b5',
          200: '#c3c9da',
          100: '#e5e8f1',
        },
        // Ember palette — wildfire identity
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Signal — secondary accent (electric / livestock-blue)
        signal: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        void: '#070a12',
        surface: {
          0: '#ffffff',
          1: '#f1f5f9',
          2: '#e2e8f0',
          3: '#cbd5e1',
        },
        fire: {
          active: '#ef4444',
          warning: '#f59e0b',
          spread1: '#fb923c',
          spread2: '#facc15',
          spread4: '#eab308',
          spread6: '#a16207',
        },
        safe: '#22c55e',
        route: {
          safe: '#22c55e',
          caution: '#eab308',
          danger: '#ef4444',
        },
        capacity: {
          open: '#22c55e',
          filling: '#eab308',
          critical: '#fb923c',
          full: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'countdown': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'countdown-sm': ['1.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'hero': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
      },
      backgroundImage: {
        'ember-radial': 'radial-gradient(120% 60% at 50% 0%, rgba(249,115,22,0.18), rgba(220,38,38,0.08) 35%, transparent 65%)',
        'coal-radial': 'radial-gradient(80% 60% at 50% 0%, rgba(28,37,64,0.9), rgba(7,10,18,1) 70%)',
        'grid-faint': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-32': '32px 32px',
      },
      boxShadow: {
        'ember-glow': '0 0 0 1px rgba(249,115,22,0.25), 0 8px 32px -8px rgba(249,115,22,0.45)',
        'coal-lift': '0 12px 40px -12px rgba(0,0,0,0.6)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'pulse-urgent': 'pulse-urgent 1.5s ease-in-out infinite',
        'pulse-critical': 'pulse-critical 0.8s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'ember-rise': 'ember-rise 6s ease-out infinite',
        'ring-pulse': 'ring-pulse 2.4s ease-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
      },
      keyframes: {
        'pulse-urgent': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-critical': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.92', transform: 'scale(1.005)' },
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
        'ember-rise': {
          '0%': { transform: 'translateY(8px) scale(0.8)', opacity: '0' },
          '20%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-48px) scale(1.1)', opacity: '0' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
