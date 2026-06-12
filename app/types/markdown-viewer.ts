export interface MarkdownSource {
  kind: "url";
  url: string;
  label: string;
  imageUrlsByFilename?: Record<string, string>;
}

export interface MarkdownRevisionOption {
  key: string;
  revisionNumber: number;
  filename: string | null;
  canView: boolean;
}
