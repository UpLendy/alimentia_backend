import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { DailyFormRepository } from "../domain/daily-form.repository";
import type { DailyForm } from "../domain/daily-form.entity";

export class GetDailyFormUseCase {
  constructor(private readonly repository: DailyFormRepository) {}

  async execute(scope: AccessScope, id: string): Promise<DailyForm> {
    const form = await this.repository.findById(scope, id);
    if (!form) throw new NotFoundError("Formato");
    return form;
  }
}
