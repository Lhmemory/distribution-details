import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f8f9fb",
        "surface-low": "#f1f4f7",
        "surface-base": "#ffffff",
        "surface-high": "#e2e9ee",
        "surface-highest": "#dbe4ea",
        "surface-dim": "#d1dce2",
        text: "#2b3438",
        muted: "#586065",
        line: "rgba(170, 179, 185, 0.24)",
        primary: "#0c56d0",
        "primary-dim": "#004aba",
        "primary-soft": "#dae2ff",
        success: "#2e7d5a",
        warning: "#9f403d",
        critical: "#752121",
        "critical-bg": "#fe8983",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 4px 20px rgba(43, 52, 56, 0.06)",
      },
      borderRadius: {
        mono: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
