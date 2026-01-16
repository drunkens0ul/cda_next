import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          600: '#0066CC',
          700: '#004C99',
          800: '#0052A3',
          900: '#0A66D8',
        },
        'primary-dark': '#003f88',
        'vision': '#0057b8',
        'vision-card': '#004693',
        'light-blue': '#EBF5FF',
        yellow: '#FFD700',
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#6B7280',
          700: '#374151',
          800: '#5F6F7A',
          900: '#2F4A5F',
        },
        'text-dark': '#1a1a1a',
        'text-gray': '#6B7280',
      },
      fontFamily: {
        sans: ['Dubai', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
