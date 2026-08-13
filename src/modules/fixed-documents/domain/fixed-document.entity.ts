export type DocumentStatus = "borrador" | "en_revision" | "vigente" | "vencido";

export interface FixedDocument {
  id: string;
  companyId: string;
  sedeId: string | null;
  name: string;
  category: string | null;
  currentVersion: number;
  status: DocumentStatus;
  fileKey: string;
  fileUrl: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FixedDocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileKey: string;
  fileUrl: string;
  uploadedBy: string | null;
  uploadedAt: Date;
}

export interface NewFixedDocumentInput {
  sedeId?: string;
  name: string;
  category?: string;
  fileKey: string;
  fileUrl: string;
}

export interface NewVersionInput {
  fileKey: string;
  fileUrl: string;
}
