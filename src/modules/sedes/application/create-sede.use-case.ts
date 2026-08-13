import { NotFoundError } from "../../../shared/errors";
import { PLAN_SEDES_INCLUDED } from "../../../config/plans";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SedeRepository } from "../domain/sede.repository";
import type { NewSedeInput, Sede } from "../domain/sede.entity";

export class CreateSedeUseCase {
  constructor(
    private readonly repository: SedeRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, input: NewSedeInput): Promise<{ sede: Sede; warning?: string }> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundError("Empresa", "f");

    const currentSedes = await this.repository.countByCompany(companyId);
    const included = PLAN_SEDES_INCLUDED[company.plan];

    const sede = await this.repository.create(companyId, input);

    // No bloqueamos la creación (las sedes extra se facturan aparte, ver Plan
    // Comercial), pero avisamos para que el front pueda mostrar el costo
    // adicional antes de confirmar.
    if (currentSedes >= included) {
      return { sede, warning: "Esta sede supera las incluidas en el plan; se facturará como sede adicional." };
    }
    return { sede };
  }
}
