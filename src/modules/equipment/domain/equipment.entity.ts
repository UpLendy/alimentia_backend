export type CalibrationFrequency = "semestral" | "anual" | "bianual";

export type CalibrationStatus = "vigente" | "por_vencer" | "vencido";

export interface Equipment {
  id: string;
  companyId: string;
  sedeId: string;
  name: string;
  brandModel: string | null;
  locationArea: string | null;
  serial: string | null;
  lastCalibrationDate: string | null;
  calibrationFrequency: CalibrationFrequency;
  nextCalibrationDate: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentWithStatus extends Equipment {
  calibrationStatus: CalibrationStatus;
}

export interface NewEquipmentInput {
  sedeId: string;
  name: string;
  brandModel?: string;
  locationArea?: string;
  serial?: string;
  lastCalibrationDate: string;
  calibrationFrequency: CalibrationFrequency;
}

// `active` no es parte del alta (NewEquipmentInput): solo se puede revertir
// un soft-delete vía PATCH, nunca al crear.
export type UpdateEquipmentInput = Partial<NewEquipmentInput> & { active?: boolean };
