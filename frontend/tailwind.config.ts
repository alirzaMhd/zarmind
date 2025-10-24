import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        // Adds a subtle, elegant pattern for our branding panel
        "gem-pattern": "radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0) 60%)",
      },
    },
  },
  plugins: [],
};
export default config;