import type { AccessScope } from "../../../shared/domain/access-scope";
import type { DailyForm, DailyFormFilters, NewDailyFormInput } from "./daily-form.entity";

export interface DailyFormRepository {
  findAll(scope: AccessScope, filters: DailyFormFilters): Promise<DailyForm[]>;
  findById(scope: AccessScope, id: string): Promise<DailyForm | null>;
  create(companyId: string, input: NewDailyFormInput): Promise<DailyForm>;
  // Usados por el dashboard (GetDashboardSummaryUseCase) para el % de
  // cumplimiento global, sin traer todas las filas a memoria.
  findFormTypesOnDate(scope: AccessScope, date: string): Promise<string[]>;
  countInRange(scope: AccessScope, from: string, to: string): Promise<number>;
}
