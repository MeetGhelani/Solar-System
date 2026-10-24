export const THREE_COLORS = {
  neonGreen: "#00ff66",
  brightGreen: "#39ff14",
  deepGreen: "#003b17",
  cyberCyan: "#00f0ff",
  electricBlue: "#0070f3",
  luxuryGold: "#d4af37",
  liquidChrome: "#e0e7ff",
  darkBackground: "#030708",
  cardBackground: "#0a0f12",
} as const;

export const CAMERA_CONFIGS = {
  globe: { position: [0, 0, 4.2] as [number, number, number], fov: 45 },
  product: { position: [0, 1.2, 3.8] as [number, number, number], fov: 42 },
  particleSphere: { position: [0, 0, 4.0] as [number, number, number], fov: 45 },
  liquidMetal: { position: [0, 0, 4.2] as [number, number, number], fov: 42 },
} as const;
