import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Цветовая палитра "Luminous Feminine B2B" ──────────────────────
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Кастомная Rose Gold палитра
        "rose-gold": {
          50:  "#FDF8F3",
          100: "#FAF0E4",
          200: "#F3D9BE",
          300: "#E8BC91",
          400: "#D49A6A",  // Основной Rose Gold акцент
          500: "#C4834F",
          600: "#A66B3C",
          700: "#87542E",
          800: "#664020",
          900: "#422814",
        },
        cream: {
          50:  "#FDFCFB",
          100: "#FAF7F4",  // Основной фон
          200: "#F0EBE3",  // Карточки
          300: "#E5DDD1",  // Разделители
        },
      },
      // ─── Типографика ───────────────────────────────────────────────────
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["3.5rem",  { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2rem",    { lineHeight: "1.2",  letterSpacing: "-0.01em" }],
      },
      // ─── Скругления ─────────────────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      // ─── Тени (мягкие, воздушные) ──────────────────────────────────────
      boxShadow: {
        soft: "0 2px 16px 0 rgba(196, 131, 79, 0.08)",
        card: "0 1px 4px 0 rgba(0,0,0,0.04), 0 4px 24px 0 rgba(196, 131, 79, 0.07)",
        glow: "0 0 32px 0 rgba(196, 131, 79, 0.18)",
      },
      // ─── Анимации ───────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        shimmer:   "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
