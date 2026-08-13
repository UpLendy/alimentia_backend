import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../domain/sede.repository";
import type { Sede, UpdateSedeInput } from "../domain/sede.entity";

export class UpdateSedeUseCase {
  constructor(private readonly repository: SedeRepository) {}

  async execute(companyId: string, id: string, input: UpdateSedeInput): Promise<Sede> {
    const updated = await this.repository.update(companyId, id, input);
    if (!updated) throw new NotFoundError("Sede", "f");
    return updated;
  }
}
