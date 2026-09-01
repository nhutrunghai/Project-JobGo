const forms = require('@tailwindcss/forms')

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        'primary-dim': '#0056b3',
        surface: '#ffffff',
        background: '#f8f9fa',
        'on-surface': '#212529',
        'on-surface-variant': '#6c757d',
        success: '#22c55e',
        warning: '#f97316',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        lg: '0.5rem',
        xl: '0.5rem',
        '2xl': '0.5rem',
        '3xl': '0.5rem',
        full: '9999px',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
}
