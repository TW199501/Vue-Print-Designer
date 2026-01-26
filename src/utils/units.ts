export const MM_TO_PX = 96 / 25.4;
export const PX_TO_MM = 25.4 / 96;

export function pxToMm(px: number): number {
  return Number((px * PX_TO_MM).toFixed(1));
}

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}
