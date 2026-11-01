import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF9F6",
        surface: "#FFFFFF",
        sst: {
          canvas: "#FAF9F6",
          slate: "#1E2538",
          "slate-light": "#2A334C",
          "slate-subtle": "#8B95A5",
          coral: "#FF6B4A",
          "coral-dark": "#E85635",
          "coral-light": "#FFF0ED",
          violet: "#5F4BB6",
          "violet-light": "#F0EDFA",
          sage: "#00A896",
          "sage-light": "#E6F6F4",
          warning: "#F59E0B",
          "warning-light": "#FEF3C7",
          danger: "#E11D48",
          "danger-light": "#FFE4E6",
        },
        duo: {
          emerald: "#00A896",
          "emerald-dark": "#008E7E",
          sky: "#1E2538",
          "sky-dark": "#161B29",
          amber: "#F59E0B",
          "amber-dark": "#D97706",
          coral: "#FF6B4A",
          "coral-dark": "#E85635",
          purple: "#5F4BB6",
          "purple-dark": "#4F3E99",
        },
      },
      boxShadow: {
        tactile: "0 4px 0 0 rgba(0, 0, 0, 0.08)",
        "tactile-press": "0 1px 0 0 rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
