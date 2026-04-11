/**
 * designSystem.js
 * Unified design tokens for glassmorphism UI
 */

export const colors = {
  // Primary palette
  primary: '#0F6E56',      // Teal
  primaryLight: '#10B981',
  primaryDark: '#047857',

  // Secondary palette
  secondary: '#3B82F6',    // Blue
  secondaryLight: '#60A5FA',
  secondaryDark: '#1D4ED8',

  // Accent colors
  accent: '#F59E0B',       // Amber/Orange
  accentRed: '#EF4444',
  accentGreen: '#10B981',
  accentYellow: '#FBBF24',

  // Backgrounds
  bgDark: '#0A192F',
  bgDarker: '#051629',
  bgGlass: 'rgba(255, 255, 255, 0.08)',
  bgGlassHover: 'rgba(255, 255, 255, 0.12)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',

  // Borders
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderMedium: 'rgba(255, 255, 255, 0.15)',
}

export const glass = {
  container: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  containerHover: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: `1px solid ${colors.borderMedium}`,
    boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '16px',
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
  },
}

export const typography = {
  // Headings
  h1: {
    fontSize: '2rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  // Body
  bodyLarge: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
  },
  body: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  // Labels
  label: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
}

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
}

export const button = {
  primary: {
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 700,
    background: colors.primaryLight,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  secondary: {
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 700,
    background: 'rgba(255, 255, 255, 0.1)',
    color: colors.textPrimary,
    border: `1px solid ${colors.borderMedium}`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
}
