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
        cream: "#fff8f0",
        warmblue: {
          50: "#eff8ff",
          100: "#dbeefe",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
        },
        warmorange: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
