// Industrial Brain - Dark Theme Colors
// Matches the web dashboard's dark industrial aesthetic

export const colors = {
  // Backgrounds
  background: '#0A0E1A',       // Deep navy-black
  surface: '#141829',          // Card backgrounds
  surfaceLight: '#1C2137',     // Elevated cards / modals
  surfaceHighlight: '#252B45', // Hover / pressed states

  // Primary Accent
  primary: '#00E5FF',          // Cyan - main accent
  primaryDark: '#00B8D4',      // Darker cyan for pressed
  primaryLight: '#18FFFF',     // Lighter cyan for highlights

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E95A9',
  textMuted: '#5A6178',

  // Status Colors
  success: '#00E676',          // Healthy / OK
  successDark: '#00C853',
  warning: '#FFD600',          // Caution / Prediction Alert
  warningDark: '#FFAB00',
  danger: '#FF1744',           // Critical / Failure
  dangerDark: '#D50000',
  info: '#448AFF',             // Informational

  // Severity Badges
  critical: '#FF1744',
  high: '#FF6D00',
  medium: '#FFD600',
  low: '#00E676',

  // Borders & Dividers
  border: '#2A3050',
  borderLight: '#3A4070',

  // Tab Bar
  tabBarBackground: '#0D1120',
  tabBarActive: '#00E5FF',
  tabBarInactive: '#5A6178',

  // Gradient pairs (for cards / headers)
  gradientPrimary: ['#00E5FF', '#0052D4'] as const,
  gradientDanger: ['#FF1744', '#FF6D00'] as const,
  gradientSuccess: ['#00E676', '#00BFA5'] as const,
};
