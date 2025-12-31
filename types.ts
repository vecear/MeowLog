export type StoolType = 'FORMED' | 'UNFORMED' | 'DIARRHEA' | null;
export type UrineStatus = 'HAS_URINE' | 'NO_URINE' | null;

export interface Owner {
  id: string;
  name: string;
  color: string; // Hex code
}

export interface PetProfile {
  name: string;
  type: 'CAT' | 'DOG';
  birthday: string; // YYYY-MM-DD format
}

export interface AppSettings {
  pet: PetProfile;
  owners: Owner[];
  isConfigured: boolean;
}

export interface CareLog {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  actions: {
    food: boolean;
    water: boolean;
    litter: boolean;
    grooming?: boolean;
    medication?: boolean;
  };
  stoolType?: StoolType;
  urineStatus?: UrineStatus;
  isLitterClean?: boolean;
  weight?: number; // in kg, e.g. 4.5 (optional)
  author: string; // Changed from literal to string (Owner ID or Name)
  note?: string;
}

export interface TaskProgress {
  morning: boolean;
  noon: boolean;
  evening: boolean;
  bedtime: boolean;
  isComplete: boolean;
}

export interface DayStatus {
  food: TaskProgress;
  water: TaskProgress;
  litter: TaskProgress;
  grooming: TaskProgress;
  medication: TaskProgress;
  weight: TaskProgress;
}

export enum CareActionType {
  FOOD = 'FOOD',
  WATER = 'WATER',
  LITTER = 'LITTER',
  GROOMING = 'GROOMING',
  MEDICATION = 'MEDICATION',
}

export interface WeightLog {
  id: string;
  timestamp: number;
  weight: number; // in kg, e.g. 4.5
  author: string; // Changed from literal to string
}