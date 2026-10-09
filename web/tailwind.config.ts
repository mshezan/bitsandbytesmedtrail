import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2430",
        mist: "#f6f4ef",
        sage: "#2f6f5e",
      },
    },
  },
  plugins: [],
};

export default config;
