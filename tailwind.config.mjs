/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#f5f7fa',
          100: '#e9eef5',
          200: '#d1dceb',
          300: '#a9bcd5',
          400: '#7a97b9',
          500: '#5c7ba0',
          600: '#4a6382',
          700: '#3d516c',
          800: '#1d3559',
          900: '#142743',
        },
        secondary: {
          50: '#f9f0f2',
          100: '#f5d9dc',
          200: '#f0b9bf',
          300: '#e88e98',
          400: '#e0535f',
          500: '#e53945',
          600: '#c92a36',
          700: '#a8222c',
          800: '#8a1d25',
          900: '#6e171e',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      gridTemplateColumns: {
        'auto': 'repeat(auto-fit, minmax(200px, 1fr))'
      },
    },
  },
  plugins: [],
};
