/** ApnaStay Aureate Living design tokens for React Native */

export const Colors = {
  // Primary — Amber/Gold
  primary: "#D97706",
  primaryDark: "#B45309",
  primaryLight: "#F59E0B",
  primaryFixed: "#FEF3C7",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#78350F",

  // Surface
  background: "#FAFAF5",
  surface: "#FFFFFF",
  surfaceContainer: "#F5F5F0",
  surfaceContainerHigh: "#EEEEEA",
  surfaceContainerLow: "#F8F8F3",
  surfaceContainerLowest: "#FFFFFF",

  // Text
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineVariant: "#C4C0CB",

  // Status
  success: "#16A34A",
  successContainer: "#DCFCE7",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  warning: "#EA580C",

  // Inverse
  inverseSurface: "#1C1B1F",
  inverseOnSurface: "#F4EFF4",

  // Misc
  scrim: "rgba(0,0,0,0.32)",
  shadow: "rgba(0,0,0,0.08)",
  divider: "#E0E0DB",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
};
