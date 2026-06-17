/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        accent: "#2196F3",
        card: "#1A1A2E",
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#F44336",
        surface: "#FFFFFF",
        textDark: "#1A1A2E",
        textGrey: "#6B7280",
      },
      fontFamily: {
        sans: ["Rubik_400Regular"],
        medium: ["Rubik_500Medium"],
        bold: ["Rubik_700Bold"],
      },
    },
  },
  plugins: [],
};
