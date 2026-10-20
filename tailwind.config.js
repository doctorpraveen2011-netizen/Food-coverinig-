import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#16A34A', // Using success green as primary brand color
          light: '#22c55e',
          dark: '#15803d'
        },
        background: '#FFFFFF',
        secondaryBg: '#F8F9FA',
        card: '#FFFFFF',
        text: {
          primary: '#111827',
          secondary: '#6B7280'
        },
        border: '#E5E7EB',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#2563EB',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
} satisfies Config
