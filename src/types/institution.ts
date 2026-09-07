import type { Address } from './common';

export type InstitutionType = 'shul' | 'yeshiva' | 'school' | 'other';

export interface Institution {
  institutionId: string;
  name: string;
  hebrewName?: string;
  type: InstitutionType;
  address: Address;
  createdByUid: string;
  createdAt: number;
}
