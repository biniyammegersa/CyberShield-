/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891b2',
          dark: '#0e7490',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar-bg) / <alpha-value>)',
          fg: 'rgb(var(--sidebar-fg) / <alpha-value>)',
          muted: 'rgb(var(--sidebar-muted) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
          hover: 'rgb(var(--sidebar-hover) / <alpha-value>)',
          'nav-fg': 'rgb(var(--sidebar-nav-fg) / <alpha-value>)',
          'nav-hover-fg': 'rgb(var(--sidebar-nav-hover-fg) / <alpha-value>)',
        },
        app: {
          bg: 'rgb(var(--app-bg) / <alpha-value>)',
          fg: 'rgb(var(--app-fg) / <alpha-value>)',
          border: 'rgb(var(--app-border) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
