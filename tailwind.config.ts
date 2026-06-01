import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
        danger: '#ef4444'
      }
    }
  },
  plugins: []
}

export default config
