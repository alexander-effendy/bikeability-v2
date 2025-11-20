/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {
      fontFamily: {
        departure: ['"Departure Mono Regular"', "monospace"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tw-animate-css"),
  ],
};
