/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#f7f5f0',
        'brand-forest': '#143626',
        'brand-forestHover': '#1c4c36',
        'brand-sage': '#628c7b',
        'brand-sageLight': '#ebf1ee',
        'brand-charcoal': '#212529',
        'brand-terracotta': '#bd5b47',
        'brand-terracottaLight': '#fdf3f1',
      }
    },
  },
  plugins: [],
}
