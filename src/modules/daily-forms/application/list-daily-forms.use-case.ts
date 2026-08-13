import type { AccessScope } from "../../../shared/domain/access-scope";
import { isDailyFormType } from "../domain/daily-form-payload.schema";
import type { DailyFormRepository } from "../domain/daily-form.repository";
import type { DailyForm, DailyFormFilters } from "../domain/daily-form.entity";

export class ListDailyFormsUseCase {
  constructor(private readonly repository: DailyFormRepository) {}

  async execute(scope: AccessScope, filters: DailyFormFilters): Promise<DailyForm[]> {
    // Un formType inválido en el filtro se ignora silenciosamente (no es un
    // error, simplemente no filtra) — así se comportaba el endpoint original.
    const formType = filters.formType && isDailyFormType(filters.formType) ? filters.formType : undefined;
    return this.repository.findAll(scope, { ...filters, formType });
  }
}
