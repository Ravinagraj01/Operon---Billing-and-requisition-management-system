export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#3b82f6', hover: '#2563eb' },
        dark: { DEFAULT: '#0a0f1e', surface: '#111827', card: '#1f2937' },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        accent: '#f4a261'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: []
}
