import type { Unit } from './types';

const ML_PER_OZ = 29.5735;

export function mlToUnit(ml: number, unit: Unit): number {
  return unit === 'oz' ? ml / ML_PER_OZ : ml;
}

export function unitToMl(value: number, unit: Unit): number {
  return unit === 'oz' ? value * ML_PER_OZ : value;
}

export function formatAmount(ml: number, unit: Unit): string {
  const value = mlToUnit(ml, unit);
  return `${Math.round(value)} ${unit}`;
}
