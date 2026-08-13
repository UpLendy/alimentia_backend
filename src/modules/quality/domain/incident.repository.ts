import type { AccessScope } from "../../../shared/domain/access-scope";
import type { Incident, NewIncidentInput } from "./incident.entity";

export interface IncidentRepository {
  findAll(scope: AccessScope): Promise<Incident[]>;
  findById(scope: AccessScope, id: string): Promise<Incident | null>;
  create(companyId: string, input: NewIncidentInput & { reportedBy: string | null }): Promise<Incident>;
}
