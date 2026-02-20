export const MM_TO_PX = 96 / 25.4;
export const PX_TO_MM = 25.4 / 96;
export const PT_TO_PX = 96 / 72;
export const PX_TO_PT = 72 / 96;

export type Unit = 'mm' | 'px' | 'pt';

export function pxToMm(px: number): number {
  return Number((px * PX_TO_MM).toFixed(1));
}

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

export function pxToPt(px: number): number {
  return Number((px * PX_TO_PT).toFixed(1));
}

export function ptToPx(pt: number): number {
  return Math.round(pt * PT_TO_PX);
}

export function pxToUnit(px: number, unit: Unit): number {
  if (unit === 'mm') return pxToMm(px);
  if (unit === 'pt') return pxToPt(px);
  return Math.round(px);
}

export function unitToPx(value: number, unit: Unit): number {
  if (unit === 'mm') return mmToPx(value);
  if (unit === 'pt') return ptToPx(value);
  return Math.round(value);
}
