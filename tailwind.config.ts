import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/core/**/*.{ts,tsx}', './src/lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf9',
          100: '#d8f8f0',
          500: '#159b89',
          600: '#087766',
          700: '#075f54',
          900: '#182d3d',
        },
      },
      boxShadow: {
        panel: '0 16px 45px rgba(24, 45, 61, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
