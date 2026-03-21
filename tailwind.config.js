/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef7ed", 100: "#fdecd4", 200: "#fad5a8", 300: "#f6b871",
          400: "#f19038", 500: "#ee7513", 600: "#df5b09", 700: "#b9430a",
          800: "#933510", 900: "#772e10", 950: "#401406",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
