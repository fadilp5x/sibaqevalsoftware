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
        canvas: "#F7F7F5",
        surface: "#FFFFFF",
        duo: {
          emerald: "#58CC02",
          "emerald-dark": "#46A302",
          sky: "#1CB0F6",
          "sky-dark": "#1899D6",
          amber: "#FFC800",
          "amber-dark": "#E5B400",
          coral: "#FF4B4B",
          "coral-dark": "#EA2B2B",
          purple: "#CE82FF",
          "purple-dark": "#b56de6",
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
