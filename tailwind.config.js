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
          navy: "#0C1B33",
          blue: "#185FA5",
          accent: "#2A4D7C",
          background: "#F8FAFC",
        }
      }
    },
  },
  plugins: [],
}
