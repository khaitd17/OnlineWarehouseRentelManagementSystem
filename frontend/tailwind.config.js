/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f4c3a",
          dark: "#0a3327",
          light: "#1a755d",
        },
        secondary: "#teal-600",
      }
    },
  },
  plugins: [],
}
