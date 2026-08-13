import { desc, eq } from "drizzle-orm";
import { db as defaultDb } from "../../../db/client";
import type { DbClient } from "../../../db/client";
import { trainings } from "../../../db/schema";
import type { TrainingRepository } from "../domain/training.repository";
import type { NewTrainingInput, Training } from "../domain/training.entity";

export class DrizzleTrainingRepository implements TrainingRepository {
  // Acepta un DbClient distinto del global (un `tx` de db.transaction) para
  // que CreateTrainingUseCase pueda insertar la capacitación y sumar las
  // horas en employees en la misma transacción — ver http/trainings.routes.ts.
  constructor(private readonly conn: DbClient = defaultDb) {}

  async findAllByEmployee(employeeId: string): Promise<Training[]> {
    const rows = await this.conn
      .select()
      .from(trainings)
      .where(eq(trainings.employeeId, employeeId))
      .orderBy(desc(trainings.trainingDate));
    return rows as Training[];
  }

  async create(employeeId: string, input: NewTrainingInput): Promise<Training> {
    const [created] = await this.conn
      .insert(trainings)
      .values({ employeeId, ...input })
      .returning();
    return created! as Training;
  }
}
