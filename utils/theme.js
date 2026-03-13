const colors = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#4CAF50',
  primaryGlass: 'rgba(46,125,50,0.90)',
  secondary: '#66BB6A',
  accent: '#FFB300',
  background: '#F1F8E9',
  surface: '#FFFFFF',
  text: '#1B2A1B',
  muted: '#5A6B5A',
  border: '#C8E6C9',
  danger: '#D32F2F',
  dangerGlass: 'rgba(211,47,47,0.90)',
  warning: '#F9A825',
  success: '#388E3C',
  overlay: 'rgba(0,0,0,0.6)',
  card: '#FFFFFF',
  headerGradientStart: '#2E7D32',
  headerGradientEnd: '#1B5E20',
  binGreen: '#4CAF50',
  binYellow: '#FFEB3B',
  binRed: '#F44336',
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
  xl: 24,
  pill: 9999,
};

const typography = {
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, fontWeight: '600', color: colors.muted },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.muted },
};

export default { colors, spacing, radii, typography };