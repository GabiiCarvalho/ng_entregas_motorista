// src/theme/colors.ts — Paleta laranja do app do motorista
export const Colors = {
  primary:     '#FF6B00',
  primaryDark: '#CC5500',
  primarySoft: '#FFF0E6',

  success:     '#16A34A',
  successSoft: '#DCFCE7',
  danger:      '#DC2626',
  dangerSoft:  '#FEE2E2',
  warning:     '#D97706',
  warningSoft: '#FEF3C7',

  pix:         '#32BCAD',
  pixSoft:     '#E6FAF8',
  cash:        '#16A34A',

  dark:        '#0F172A',
  darkMid:     '#1E293B',
  grey:        '#64748B',
  greyLight:   '#F1F5F9',
  border:      '#E2E8F0',
  white:       '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;