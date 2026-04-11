import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "fn-blue": "hsl(var(--fn-blue))",
        "fn-red": "hsl(var(--fn-red))",
        // Campaign-inspired colors
        "campaign-gold": "hsl(var(--campaign-gold))",
        "campaign-blue": "hsl(var(--campaign-blue))",
        "campaign-red": "hsl(var(--campaign-red))",
        "campaign-purple": "hsl(var(--campaign-purple))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        'campaign-gradient': 'linear-gradient(135deg, hsl(217 78% 25%) 0%, hsl(270 60% 35%) 50%, hsl(0 72% 25%) 100%)',
        'gold-gradient': 'linear-gradient(135deg, hsl(45 96% 65%) 0%, hsl(35 85% 55%) 100%)',
        'vote-gradient': 'linear-gradient(135deg, hsl(220 25% 8%) 0%, hsl(270 60% 12%) 50%, hsl(217 78% 8%) 100%)',
      },
      boxShadow: {
        'campaign': '0 25px 50px -12px hsl(220 25% 8% / 0.8)',
        'gold': '0 25px 50px -12px hsl(45 96% 65% / 0.2)',
        'glow': '0 0 30px hsl(45 96% 65% / 0.3)',
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
