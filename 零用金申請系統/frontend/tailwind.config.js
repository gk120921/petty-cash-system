/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bcd0ff',
          300: '#8eb0ff',
          400: '#5887ff',
          500: '#2558ff',
          600: '#0031ff',
          700: '#0026e6',
          800: '#0020bf',
          900: '#001a99',
        },
      },
    },
  },
  plugins: [],
}
