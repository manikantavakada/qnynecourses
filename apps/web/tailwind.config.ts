import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#141414',
        paper: '#fbfaf7',
        line: '#d8d3c8',
        moss: '#4f6f52',
        brick: '#a94f3d',
        marine: '#27586b',
      },
    },
  },
  plugins: [],
} satisfies Config;
