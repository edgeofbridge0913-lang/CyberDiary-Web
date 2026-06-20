/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'radial-gradient(from 180deg at var(--tw-origin), var(--tw-gradient-stops))',
      },
      colors: {
        // サイバーパンクのメインカラー定義
        'neon-pink': '#FF3B8D',
        'dark-bg': '#05020c', // 黒より深みのある背景色
      },
      boxShadow: {
        // ネオンピンクのグロー影をカスタム定義 (適用先: 要素自体)
        'neon-glow': '0 0 10px rgba(255, 59, 141, 0.8), 0 0 20px rgba(255, 59, 141, 0.6)',
        'neon-pink': '0 0 5px #FF3B8D, 0 0 10px #FF3B8D, 0 0 20px rgba(255, 59, 141, 0.7)',
      }
    },
  },
  plugins: [],
};