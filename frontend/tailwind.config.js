/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#F3EFE6',
          surface: '#FAF8F2',
          secondary: '#E8E1D5',
          dark: '#292B24',
          darkSurface: '#34372E',
          text: '#252720',
          muted: '#77766B',
          border: '#D4CCBE',
          vermilion: '#D84A2F',
          vermilionHover: '#C23D24',
          olive: '#B6C66B',
          operational: '#427A55',
          warning: '#C17B27',
          critical: '#C63E32',
          info: '#726D5B',
        }
      },
      fontFamily: {
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
