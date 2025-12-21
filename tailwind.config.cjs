/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ["Lato", "sans-serif"],
      },
      colors: {
  brand: {
    gold: {
      DEFAULT: "#D4AF37",
      30: "rgba(212, 175, 55, 0.3)",
    },
    dark: {
      DEFAULT: "#1A1A1A",
      30: "rgba(26, 26, 26, 0.3)",
    },
    accent: "#C41E3A",
    light: "#F5F5F5",
  },
},

    },
  },
  plugins: [],
};
