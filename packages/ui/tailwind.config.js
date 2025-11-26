/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "moon-orange": "#E36139",
        "moon-pink": "#e91e63",
        "moon-yellow": "#f5ae10",
        "moon-green": "#09d69c",
        "moon-dark": "#2b2c2f",
        "moon-dark-light": "#3b3c3f", // slightly lighter for cards
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
};