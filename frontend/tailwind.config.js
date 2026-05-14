/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slow-zoom': 'slow-zoom 30s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 8s ease-in-out infinite',
      },
      keyframes: {
        'slow-zoom': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
