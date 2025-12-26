import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefdf8',
          100: '#fefbef0',
          200: '#fef7e0',
          300: '#fdf0c8',
          400: '#fae69e',
          500: '#f7d869', // Main yellow
          600: '#f4c840',
          700: '#e8a616',
          800: '#c1830d',
          900: '#9e6a0f',
        },
        background: '#ffffff',
        foreground: '#0a0a0a',
        card: {
          DEFAULT: '#ffffff',
          background: '#fafafa',
          foreground: '#0a0a0a',
          border: '#f0f0f0',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          background: '#f8f8f8',
          foreground: '#6b7280',
          border: '#e5e7eb',
        },
        border: {
          DEFAULT: '#e5e7eb',
          subtle: '#f1f3f4',
          'subtle-hover': '#e5e7eb',
        },
        ring: '#f7d869',
        accent: '#f7d869',
        secondary: '#f8fafc',
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'heading-1': [
          '2.25rem',
          { lineHeight: '2.5rem', fontWeight: '700' },
        ],
        'heading-2': [
          '1.875rem',
          { lineHeight: '2.25rem', fontWeight: '600' },
        ],
        'heading-3': [
          '1.5rem',
          { lineHeight: '2rem', fontWeight: '600' },
        ],
        'body-large': [
          '1.125rem',
          { lineHeight: '1.75rem', fontWeight: '400' },
        ],
        'body': [
          '1rem',
          { lineHeight: '1.5rem', fontWeight: '400' },
        ],
        'body-small': [
          '0.875rem',
          { lineHeight: '1.25rem', fontWeight: '400' },
        ],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'form': '0 0 0 1px rgb(0 0 0 / 0.05)',
        'form-focus': '0 0 0 1px #f7d869, 0 0 0 3px rgba(247, 216, 105, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      borderRadius: {
        'card': '0.75rem',
        'form': '0.5rem',
        'button': '0.375rem',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
}
export default config