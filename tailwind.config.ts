import type { Config } from 'tailwindcss';

// Design system tokens — see docs/design-system.md
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F0F6FF',
        surface: '#FFFFFF',
        accent: {
          DEFAULT: '#1B3A6B',
          soft: '#2E5FA3',
        },
        text: {
          DEFAULT: '#0D1B2A',
          muted: '#6B7C93',
        },
        border: '#D6E4F0',
        success: '#2A7D4F',
        error: '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'Heebo', 'sans-serif'],
        he: ['Heebo', 'Inter', 'sans-serif'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(27, 58, 107, 0.08)',
        corner: '0 4px 12px rgba(27, 58, 107, 0.25)',
        navbar: '0 4px 24px rgba(27, 58, 107, 0.12)',
      },
      transitionDuration: {
        200: '200ms',
        250: '250ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
