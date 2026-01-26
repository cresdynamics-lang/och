import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette (Cyber + Mission Tone)
        och: {
          midnight: '#0A0A0C',      // OCH Midnight Black - Backgrounds, dashboards
          defender: '#0648A8',      // Defender Blue - Primary CTA, brand strength
          mint: '#33FFC1',          // Cyber Mint - Highlights, success, data pulses
          orange: '#F55F28',        // Signal Orange - Alerts, warnings, mission urgency
          steel: '#A8B0B8',         // Steel Grey - Secondary text, outlines
          // Secondary Palette (Africa-inspired)
          gold: '#C89C15',          // Sahara Gold - Leadership elements
          'desert-clay': '#E36F46', // Desert Clay - Entrepreneurship accents
          'savanna-green': '#4FAF47', // Savanna Green - Growth, progression indicators
          'night-sky': '#213A7F',   // Night Sky Blue - Background gradients
          // Legacy/supporting colors
          slate: {
            50: '#F8F9FA',
            100: '#F1F3F5',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#868E96',
            700: '#495057',
            800: '#343A40',
            900: '#212529',
          },
        },
        // Mission-specific colors
        'mission-success': '#4FAF47', // Savanna Green
        'mission-warning': '#F55F28', // Signal Orange
        'mission-critical': '#EF4444',
        'mission-primary': '#0648A8', // Defender Blue
        'mission-recipe': '#33FFC1',  // Cyber Mint
        // Dashboard colors (for backward compatibility)
        dashboard: {
          bg: '#0A0A0C',          // OCH Midnight
          card: '#1e293b',
          accent: '#33FFC1',      // Cyber Mint
          success: '#4FAF47',     // Savanna Green
          warning: '#F55F28',     // Signal Orange
          error: '#EF4444',
          glass: 'rgba(30,41,59,0.8)',
        },
      },
      backgroundImage: {
        'defender-gradient': 'linear-gradient(135deg, #0648A8 0%, #0A0A0C 100%)',
        'leadership-gradient': 'linear-gradient(135deg, #C89C15 0%, #0A0A0C 100%)',
      },
      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.03em',
      },
      fontSize: {
        // Typography Hierarchy per Design System
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.03em' }], // Mission Title (32-36px, Bold)
        'h2': ['26px', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em' }], // Section Title (26-28px, Bold)
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.02em' }], // Subtitle (20-22px, Semi-Bold)
        'body-l': ['18px', { lineHeight: '1.6', fontWeight: '400' }], // Playbook content
        'body-m': ['16px', { lineHeight: '1.6', fontWeight: '400' }], // Most text
        'body-s': ['14px', { lineHeight: '1.5', fontWeight: '400' }], // Tooltips, metadata
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '6px', // Card border radius per design system
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 1.5s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(3, 72, 168, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(3, 72, 168, 0.8), 0 0 30px rgba(51, 255, 193, 0.4)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(3, 72, 168, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(3, 72, 168, 0.8)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

