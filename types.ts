export interface ImageData {
  data: string; // base64 encoded string
  mimeType: string;
}

export interface StyleSuggestion {
  name: string;
  prompt: string;
}

export interface ParsedTask {
  item: string; // e.g., "Cabinets"
  change: string; // e.g., "turn them green"
}
