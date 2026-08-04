export interface LevelInfo {
  level: number;
  xp: number;
  currentLevelFloor: number;
  nextLevelXp: number;
  progressPct: number;
  xpIntoLevel: number;
  xpForNext: number;
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(xp, 0) / 50)) + 1);
}

export function xpFloorForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 50;
}

export function getLevelInfo(xp: number): LevelInfo {
  const level = levelFromXp(xp);
  const currentLevelFloor = xpFloorForLevel(level);
  const nextLevelXp = xpFloorForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelFloor;
  const xpForNext = nextLevelXp - currentLevelFloor;
  const progressPct = Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100));
  return { level, xp, currentLevelFloor, nextLevelXp, progressPct, xpIntoLevel, xpForNext };
}

export const RARITY_COLORS: Record<string, string> = {
  common: "#94a3b8",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};
