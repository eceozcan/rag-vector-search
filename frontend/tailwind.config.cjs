module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Playable-ads studio palette: deep night base with a dual accent
        // (electric violet + vivid mint) to avoid the single-accent default look.
        night: {
          950: '#0B0A1F',
          900: '#111031',
          800: '#191740',
          700: '#232055',
        },
        violet: {
          DEFAULT: '#7C5CFF',
          soft: '#9E86FF',
        },
        mint: {
          DEFAULT: '#3DE8B0',
          soft: '#7CF3CC',
        },
        coral: '#FF6B5D',
        ink: {
          DEFAULT: '#F5F4FF',
          soft: '#A8A5C8',
          faint: '#726E9A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(124, 92, 255, 0.5)',
        'glow-mint': '0 0 40px -12px rgba(61, 232, 176, 0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, -20px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-ring': 'pulse-ring 2.5s ease-in-out infinite',
        drift: 'drift 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};