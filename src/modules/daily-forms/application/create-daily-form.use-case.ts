import { Value } from "@sinclair/typebox/value";
import { NotFoundError, ValidationError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import { DAILY_FORM_TYPES, dailyFormPayloadSchemas, isDailyFormType } from "../domain/daily-form-payload.schema";
import type { DailyFormRepository } from "../domain/daily-form.repository";
import type { DailyForm } from "../domain/daily-form.entity";

export interface CreateDailyFormInput {
  sedeId: string;
  formDate: string;
  shift?: string;
  observations?: string;
  payload: Record<string, unknown>;
}

export class CreateDailyFormUseCase {
  constructor(
    private readonly repository: DailyFormRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(
    companyId: string,
    submittedBy: string,
    formType: string,
    input: CreateDailyFormInput,
  ): Promise<DailyForm> {
    if (!isDailyFormType(formType)) {
      throw new ValidationError(`Tipo de formato inválido. Debe ser uno de: ${DAILY_FORM_TYPES.join(", ")}`);
    }

    // La sede indicada debe pertenecer a la misma empresa (ver la misma
    // validación en CreateEmployeeUseCase) — evita que un formato quede
    // asociado a la sede de otra empresa.
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    // Regla de dominio: el payload debe cumplir el schema propio de este
    // formType (ver domain/daily-form-payload.schema.ts) antes de persistir.
    const payloadSchema = dailyFormPayloadSchemas[formType];
    if (!Value.Check(payloadSchema, input.payload)) {
      const details = [...Value.Errors(payloadSchema, input.payload)].map((e) => ({
        path: e.path,
        message: e.message,
      }));
      throw new ValidationError("El payload no cumple con el formato esperado para este tipo de formato.", details);
    }

    return this.repository.create(companyId, { ...input, formType, submittedBy });
  }
}
