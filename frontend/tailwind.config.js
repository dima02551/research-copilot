/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0D12',
        card: '#151822',
        border: '#232735',
        accent: '#5B8CFF',
        muted: '#8891A5',
      },
    },
  },
  plugins: [],
};
