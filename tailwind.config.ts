import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        styvia: {
          pink: "hsl(var(--styvia-pink))",
          orange: "hsl(var(--styvia-orange))",
          green: "hsl(var(--styvia-green))",
          gold: "hsl(var(--styvia-gold))",
          dark: "hsl(var(--styvia-dark))",
          gray: "hsl(var(--styvia-gray))",
          "light-gray": "hsl(var(--styvia-light-gray))",
          success: "hsl(var(--styvia-success))",
          discount: "hsl(var(--styvia-discount))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        intelligence: {
          deep: "hsl(var(--intelligence-deep))",
          mid: "hsl(var(--intelligence-mid))",
          accent: "hsl(var(--intelligence-accent))",
          glow: "hsl(var(--intelligence-glow))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Assistant', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Times New Roman', 'serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "assistant-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(1.45)", opacity: "0" },
        },
        "assistant-shimmer": {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "assistant-message-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "assistant-gradient": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        /** Body profile / measurement studio */
        "body-zone-glow": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.06)" },
        },
        "body-zone-float": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-8px) translateX(4px)" },
          "66%": { transform: "translateY(4px) translateX(-4px)" },
        },
        "body-scan": {
          "0%": { transform: "translateY(-120%)", opacity: "0" },
          "15%": { opacity: "0.35" },
          "85%": { opacity: "0.35" },
          "100%": { transform: "translateY(120%)", opacity: "0" },
        },
        "body-tick": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.7" },
        },
        /** Virtual wardrobe / closet room */
        "wardrobe-ambient": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.03)" },
        },
        "wardrobe-rail-shine": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        /** Home & catalog listing */
        "ken-burns": {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.09) translate(-1.5%, -0.5%)" },
        },
        "home-reveal-up": {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "home-float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(12px, -18px) scale(1.05)" },
          "66%": { transform: "translate(-10px, 10px) scale(0.98)" },
        },
        "home-gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "home-shimmer-sweep": {
          "0%": { transform: "translateX(-100%) skewX(-12deg)", opacity: "0" },
          "20%": { opacity: "0.35" },
          "60%": { opacity: "0.2" },
          "100%": { transform: "translateX(200%) skewX(-12deg)", opacity: "0" },
        },
        "home-pulse-soft": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.08)" },
        },
        "deal-card-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
          "50%": { boxShadow: "0 12px 40px -8px hsl(var(--primary) / 0.25)" },
        },
        /** Category listing hero — light rays */
        "category-hero-ray": {
          "0%": { transform: "translateX(-130%) skewX(-20deg)", opacity: "0" },
          "12%": { opacity: "0.55" },
          "45%": { opacity: "0.4" },
          "100%": { transform: "translateX(320%) skewX(-20deg)", opacity: "0" },
        },
        "category-hero-ray-narrow": {
          "0%": { transform: "translateX(-160%) skewX(-28deg)", opacity: "0" },
          "18%": { opacity: "0.35" },
          "40%": { opacity: "0.22" },
          "100%": { transform: "translateX(380%) skewX(-28deg)", opacity: "0" },
        },
        "category-hero-edge-shine": {
          "0%, 100%": { opacity: "0.35", transform: "translateX(-20%)" },
          "50%": { opacity: "0.85", transform: "translateX(20%)" },
        },
        "category-hero-vignette-pulse": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "assistant-ring": "assistant-ring 2.2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "assistant-shimmer": "assistant-shimmer 2.5s linear infinite",
        "assistant-message-in":
          "assistant-message-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "assistant-gradient": "assistant-gradient 8s ease infinite",
        "body-zone-glow": "body-zone-glow 7s ease-in-out infinite",
        "body-zone-float": "body-zone-float 12s ease-in-out infinite",
        "body-scan": "body-scan 4.5s ease-in-out infinite",
        "body-tick": "body-tick 2.2s ease-in-out infinite",
        "wardrobe-ambient": "wardrobe-ambient 14s ease-in-out infinite",
        "wardrobe-rail-shine": "wardrobe-rail-shine 18s linear infinite",
        "ken-burns": "ken-burns 14s ease-in-out infinite alternate",
        "home-reveal-up": "home-reveal-up 0.75s cubic-bezier(0.22, 1, 0.36, 1) both",
        "home-float-slow": "home-float-slow 18s ease-in-out infinite",
        "home-gradient-shift": "home-gradient-shift 10s ease infinite",
        "home-shimmer-sweep": "home-shimmer-sweep 2.8s ease-in-out infinite",
        "home-pulse-soft": "home-pulse-soft 5s ease-in-out infinite",
        "deal-card-glow": "deal-card-glow 4s ease-in-out infinite",
        "category-hero-ray": "category-hero-ray 5.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "category-hero-ray-narrow": "category-hero-ray-narrow 7.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "category-hero-edge-shine": "category-hero-edge-shine 4s ease-in-out infinite",
        "category-hero-vignette-pulse": "category-hero-vignette-pulse 8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
