import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { suppliers, supplierDocuments, supplierEvaluations } from "../../../db/schema";
import type { SupplierRepository } from "../domain/supplier.repository";
import type {
  Supplier,
  NewSupplierInput,
  UpdateSupplierInput,
  SupplierDocument,
  NewSupplierDocumentInput,
  SupplierEvaluation,
  NewSupplierEvaluationInput,
} from "../domain/supplier.entity";

export class DrizzleSupplierRepository implements SupplierRepository {
  async findAllByCompany(companyId: string): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.companyId, companyId));
  }

  async findById(companyId: string, id: string): Promise<Supplier | null> {
    const [row] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .limit(1);
    return row ?? null;
  }

  async create(companyId: string, input: NewSupplierInput): Promise<Supplier> {
    const [created] = await db
      .insert(suppliers)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  async update(companyId: string, id: string, input: UpdateSupplierInput): Promise<Supplier | null> {
    const [updated] = await db
      .update(suppliers)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .returning();
    return updated ?? null;
  }

  async addDocument(supplierId: string, input: NewSupplierDocumentInput): Promise<SupplierDocument> {
    const [created] = await db
      .insert(supplierDocuments)
      .values({ supplierId, ...input })
      .returning();
    return created!;
  }

  async addEvaluation(
    supplierId: string,
    evaluatorId: string | null,
    input: NewSupplierEvaluationInput,
  ): Promise<SupplierEvaluation> {
    const [created] = await db
      .insert(supplierEvaluations)
      .values({ supplierId, evaluatorId, ...input })
      .returning();
    return created!;
  }

  async listEvaluations(supplierId: string): Promise<SupplierEvaluation[]> {
    return db.select().from(supplierEvaluations).where(eq(supplierEvaluations.supplierId, supplierId));
  }
}
