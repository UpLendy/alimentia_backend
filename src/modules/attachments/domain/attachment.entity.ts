export interface Attachment {
  id: string;
  companyId: string;
  sedeId: string | null;
  category: string;
  linkedDocumentId: string | null;
  name: string;
  documentDate: string | null;
  fileKey: string;
  fileUrl: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  uploadedBy: string | null;
  createdAt: Date;
}

export interface NewAttachmentInput {
  sedeId?: string;
  category: string;
  linkedDocumentId?: string;
  name: string;
  documentDate?: string;
  fileKey: string;
  fileUrl: string;
  fileType?: string;
  fileSizeBytes?: number;
}
