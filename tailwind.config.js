/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Repurposed as light surface/neutral scale (kept name for minimal diff)
        navy: {
          950: '#FFFFFF', // page background
          900: '#FFFFFF', // card / nav background
          800: '#FFFFFF', // card background
          700: '#E5E7EB', // borders
          600: '#D1D5DB', // hover borders
        },
        ink: {
          950: '#0A0F1E', // headings
          700: '#444444', // body text
          500: '#6B7280', // muted text
          300: '#9CA3AF', // placeholder / faint
        },
        surface: {
          DEFAULT: '#F8F9FA', // light grey background
          100: '#F3F4F6',
        },
        electric: {
          50: '#EBF2FF',
          100: '#D6E4FF',
          200: '#ADCCFF',
          300: '#84B3FF',
          400: '#5C9AFF',
          500: '#3B7EFF',
          600: '#2D63CC',
          700: '#1F4A99',
          800: '#163166',
          900: '#0E1F44',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
