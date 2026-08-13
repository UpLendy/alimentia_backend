import type { DailyFormType } from "./daily-form-payload.schema";

export type { DailyFormType };
export { DAILY_FORM_TYPES } from "./daily-form-payload.schema";

export interface DailyForm {
  id: string;
  companyId: string;
  sedeId: string;
  formType: DailyFormType;
  formDate: string;
  shift: string | null;
  submittedBy: string | null;
  payload: Record<string, unknown>;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewDailyFormInput {
  sedeId: string;
  formType: DailyFormType;
  formDate: string;
  shift?: string;
  submittedBy: string;
  payload: Record<string, unknown>;
  observations?: string;
}

export interface DailyFormFilters {
  formType?: string;
  from?: string;
  to?: string;
}
