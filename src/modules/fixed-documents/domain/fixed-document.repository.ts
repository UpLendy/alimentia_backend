import type {
  FixedDocument,
  FixedDocumentVersion,
  NewFixedDocumentInput,
  NewVersionInput,
} from "./fixed-document.entity";

export interface FixedDocumentRepository {
  findAllByCompany(companyId: string): Promise<FixedDocument[]>;
  findById(companyId: string, id: string): Promise<FixedDocument | null>;
  listVersions(documentId: string): Promise<FixedDocumentVersion[]>;
  create(companyId: string, input: NewFixedDocumentInput): Promise<FixedDocument>;
  insertVersion(documentId: string, version: number, input: NewVersionInput, uploadedBy: string): Promise<void>;
  updateCurrentFile(id: string, version: number, input: NewVersionInput): Promise<FixedDocument | null>;
  approve(companyId: string, id: string, approvedBy: string): Promise<FixedDocument | null>;
}
