import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        near: {
          green: "#00EC97",
          greenHover: "#00FFA3",
          greenDark: "#003822",
          black: "#08090B",
          surface: "#0F1115",
          surfaceElevated: "#16191F",
          border: "#222730",
          borderSubtle: "rgba(255, 255, 255, 0.08)",
          textPrimary: "#F3F4F6",
          textSecondary: "#9CA3AF",
          textMuted: "#6B7280"
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        'near-glow': '0 0 16px -2px rgba(0, 236, 151, 0.15)',
        'surface-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
