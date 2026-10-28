/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obs: {
          bg: '#0B0F14',
          sidebar: '#0E131A',
          surface: '#131A23',
          elevated: '#192330',
          hover: '#202B39',
          border: '#263241',
          subtle: '#1D2733',
          focus: '#3DD6C6',
          primary: '#E8EDF4',
          secondary: '#9AA8B8',
          muted: '#687789',
          teal: '#3DD6C6',
          tealHover: '#59E2D2',
          lavender: '#A99BFF',
          link: '#8BB8FF',
          operational: '#45D483',
          degraded: '#F2B866',
          down: '#FF647C',
          info: '#72B7FF',
          paused: '#8592A3',
        }
      }
    },
  },
  plugins: [],
}
