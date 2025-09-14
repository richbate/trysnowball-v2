/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic theme colors - Enhanced Purple Theme
        bg: '#faf9ff',          // Very light purple tint background
        surface: '#ffffff',     // Pure white for cards
        primary: '#8B5CF6',     // Richer violet purple (was #A884F3)
        accent: '#C4B5FD',      // Lighter purple accent (was #D2C2FA) 
        secondary: '#F3F0FF',   // Very light purple surface
        danger: '#EF5C75',
        success: '#10B981',     // Better green
        text: '#1F2937',        // Darker text for better contrast
        muted: '#6B7280',       // Better muted text
        border: '#E5E7EB',      // Light gray border
        // Legacy brand colors (keep for backwards compatibility)
        brand: {
          primary: '#A884F3',
          secondary: '#D2C2FA',
          text: '#222222',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}