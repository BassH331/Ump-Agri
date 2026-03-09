const colors = {
  primary: '#276EF1',
  primaryGlass: 'rgba(39,110,241,0.90)',
  secondary: '#00A896',
  accent: '#FF7F50',
  background: '#F7F7F7',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#666666',
  border: '#E5E5EA',
  danger: '#FF3B30',
  dangerGlass: 'rgba(255,59,48,0.90)',
  warning: '#FFCC00',
  success: '#34C759',
  overlay: 'rgba(0,0,0,0.6)'
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,
};

const typography = {
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, fontWeight: '600', color: colors.muted },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.muted },
};

export default { colors, spacing, radii, typography };