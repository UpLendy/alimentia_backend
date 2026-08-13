import type { NewSedeInput, Sede, UpdateSedeInput } from "./sede.entity";

export interface SedeRepository {
  findAllByCompany(companyId: string): Promise<Sede[]>;
  // Usado por otros módulos (employees, equipment, daily-forms) para
  // confirmar que un sedeId recibido en el body pertenece a la empresa del
  // usuario autenticado, antes de asociarle un registro nuevo.
  findById(companyId: string, id: string): Promise<Sede | null>;
  countByCompany(companyId: string): Promise<number>;
  create(companyId: string, input: NewSedeInput): Promise<Sede>;
  update(companyId: string, id: string, input: UpdateSedeInput): Promise<Sede | null>;
}
