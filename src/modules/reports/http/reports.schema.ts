import { t } from "elysia";

export const generateInspectionReportBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  from: t.String({ format: "date" }),
  to: t.String({ format: "date" }),
});
