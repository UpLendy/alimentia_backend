export interface Sede {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  city: string | null;
  isMain: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSedeInput {
  name: string;
  address?: string;
  city?: string;
  isMain?: boolean;
}

export type UpdateSedeInput = Partial<NewSedeInput>;
