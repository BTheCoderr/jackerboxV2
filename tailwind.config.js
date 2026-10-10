/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Jackerbox brand colors
        'jacker-blue': '#216c99',
        'jacker-blue-soft': '#eaf3f9',
        'jacker-orange': '#b85f07',
        'jacker-orange-hover': '#914902',
        'jacker-orange-soft': '#fff1df',
        'jacker-surface': '#f7fafc',
        'jacker-ink': '#172b40',
        // Map legacy blue utilities to the JackerBox hue.
        blue: {
          50: '#edf6fb', 100: '#d9eaf6', 200: '#b7d9ed',
          300: '#8dc3df', 400: '#559fcb', 500: '#2980b9',
          600: '#216c99', 700: '#195778', 800: '#17415b',
          900: '#142e45', 950: '#0c1b2c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
} 