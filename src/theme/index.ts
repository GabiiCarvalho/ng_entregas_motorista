export { Colors } from './colors';

export const Typography = {
  xs: 10, sm: 12, md: 14, base: 15,
  lg: 17, xl: 20, '2xl': 24, '3xl': 28, '4xl': 32,
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16,
  xl: 20, '2xl': 24, '3xl': 32,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  lg: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
} as const;