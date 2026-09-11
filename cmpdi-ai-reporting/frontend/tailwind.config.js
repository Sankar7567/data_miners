/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coal: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
        },
        cmpdi: {
          dark: '#0A2540',
          blue: '#1E40AF',
          teal: '#0D9488',
          gold: '#D97706',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
