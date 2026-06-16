/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d7ff',
          300: '#a6bdff',
          400: '#7c99ff',
          500: '#5a73ff',
          600: '#4350f5',
          700: '#3540d8',
          800: '#2d35ae',
          900: '#2a3289',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
