var config = {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                canvas: "#f7f9fc",
                "surface-low": "#f3f6fb",
                "surface-base": "#ffffff",
                "surface-high": "#e8eef7",
                "surface-highest": "#dbe5f1",
                "surface-dim": "#c9d4e2",
                text: "#182230",
                muted: "#667085",
                line: "rgba(145, 158, 171, 0.24)",
                primary: "#2563eb",
                "primary-dim": "#1d4ed8",
                "primary-soft": "#e8f0ff",
                success: "#16a36b",
                warning: "#f59e0b",
                critical: "#e11d48",
                "critical-bg": "#ffe4e8",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            boxShadow: {
                ambient: "0 10px 28px rgba(16, 24, 40, 0.06)",
                panel: "0 1px 2px rgba(16, 24, 40, 0.04), 0 10px 24px rgba(16, 24, 40, 0.04)",
                subtle: "0 1px 2px rgba(16, 24, 40, 0.035)",
            },
            borderRadius: {
                mono: "0.5rem",
            },
        },
    },
    plugins: [],
};
export default config;
