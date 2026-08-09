export type Unit = 'ml' | 'oz';

export interface Entry {
  id: string;
  amountMl: number;
  time: string; // ISO timestamp
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  entries: Entry[];
}

export interface Settings {
  goalMl: number;
  unit: Unit;
  quickAddsMl: number[];
}
