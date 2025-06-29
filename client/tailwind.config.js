/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all files inside src
  ],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        slide: "slide 5s linear infinite",
        "fade-in": "fade-in 0.3s ease-in-out",
      },
      keyframes: {
        slide: {
          from: { left: "-15%" },
          to: { left: "115%" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      colors: {
        white: {
          0: "#FFFFFF",
          10: "#F9FAFB",
          20: "#F9FAFBCC",
          30: "#E5E7EB",
        },
        gray: {
          0: "#4D5562",
          10: "#212936",
        },
        black: {
          0: "#121826",
          10: "#000000",
        },
        blue: {
          0: "#C2DAF9",
          10: "#3662E3",
        },
        green: {
          enabled: "rgba(53, 362, 25, 0.5)"
        },
        red: {
          disabled: "rgba(255, 99, 132, 0.5)"
        }
      },
      fontFamily: {
        "inter-light": ["light"],
        "inter-medium": ["medium"],
        "inter-semibold": ["semi-bold"],
        "inter-bold": ["bold"],
      },
    },
  },
  plugins: [],
};
