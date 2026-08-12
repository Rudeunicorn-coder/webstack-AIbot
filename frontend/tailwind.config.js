const typeface = ['Inter', 'system-ui', 'sans-serif'];
const display = ['Sora', 'Inter', 'system-ui', 'sans-serif'];

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: typeface,
        display: display,
      },
      colors: {
        // ============ WebStackPro Brand Palette ============
        navy: {
          DEFAULT: '#0A1F44',
          light: '#122E63',
          lightest: '#1B3F85',
        },
        cyan: {
          DEFAULT: '#00D4FF',
          dark: '#00A8CC',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: '#00D4FF',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0A1F44',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#00D4FF',
          foreground: '#0A1F44',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 212, 255, 0.35)',
        'glow-lg': '0 0 48px rgba(0, 212, 255, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        sparkle: 'sparkle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};