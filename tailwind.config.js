/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { ink: '#20211f', paper: '#f5f5f2', muted: '#797b75', line: '#e4e5df', accent: '#b7f36b' },
    boxShadow: { soft: '0 12px 40px rgba(25, 28, 20, .06)' }
  }},
  plugins: []
}