import type { Message } from "@langchain/langgraph-sdk";

export interface GeomExportEntry {
  filename: string;
  url: string;
}

export interface PartEntry {
  name: string;
  script_path: string;
  exports: GeomExportEntry[];
  executed_at: string;
}

export interface TodoItem {
  id?: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface TexocadGraphState {
  messages: Message[];
  todos?: TodoItem[];
  product?: PartEntry[];
}

export interface CustomProductEvent {
  type: "product";
  parts: PartEntry[];
}

export interface StoredBlobArtifact {
  filename: string;
  blobName: string;
  contentType: string;
  checksum: string;
}

export interface DesignRevisionArtifact {
  type: "texocad.design_revision";
  designId: string;
  revisionNumber: number;
  source: StoredBlobArtifact;
  exports: StoredBlobArtifact[];
  createdByThreadId: string;
  createdByRunId?: string;
}
