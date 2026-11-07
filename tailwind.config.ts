import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0c0e",
          900: "#111214",
          850: "#16171a",
          800: "#1b1c20",
          700: "#25272c",
          600: "#33363d",
          500: "#4a4e57",
          400: "#6b707b",
          300: "#9198a3",
          200: "#c2c7cf",
          100: "#e6e8ec",
        },
        accent: {
          DEFAULT: "#22c55e",
          soft: "#16a34a",
          muted: "rgba(34,197,94,0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
