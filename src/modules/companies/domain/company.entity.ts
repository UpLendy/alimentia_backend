import type { Plan } from "../../../config/plans";

// Entidad de dominio: la forma "de negocio" de una empresa cliente. No
// importa nada de Drizzle ni de Elysia.
export interface Company {
  id: string;
  name: string;
  nit: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  plan: Plan;
  status: "activo" | "suspendido" | "prueba";
  businessProfile: "restaurante_general" | "carnicos" | "bodega_almacenamiento" | "ambulantes";
  sedesIncluded: number;
  billingAnnualPrepay: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UpdateCompanyInput = Partial<{
  name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
}>;
