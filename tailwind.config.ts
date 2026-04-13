import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
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
        // Status colors
        "status-success": "hsl(var(--status-success))",
        "status-warning": "hsl(var(--status-warning))",
        "status-info": "hsl(var(--status-info))",
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
        'vote-gradient': 'var(--vote-gradient)',
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
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "shimmer": "shimmer 2.5s infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
