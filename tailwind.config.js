/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1e1e2e',
          hover: '#2a2a3e',
          active: '#363654',
        },
        chat: {
          bg: '#11111b',
          panel: '#181825',
          border: '#313244',
        },
        accent: {
          DEFAULT: '#89b4fa',
          muted: '#6c7086',
        },
      },
    },
  },
  plugins: [],
}
