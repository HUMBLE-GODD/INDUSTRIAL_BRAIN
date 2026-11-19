// Typography scale
import { Platform } from 'react-native';

const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const typography = {
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  tabLabel: {
    fontFamily,
    fontSize: 10,
    fontWeight: '500' as const,
  },
};
