/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand:   "#E1D9C9",
        stone:  "#AE9372",
        coffee: "#B27D57",
        ochre:  "#7F4B30",
        gum:    "#7D8769",
        moss:   "#424C21",
        forest: "#173125",
        basalt: "#212E40",
        red:    "#B85C5A",
        blue:   "#2B4A73",
        yellow: "#B28B2B",
      },
    },
  },
  plugins: [],
};
