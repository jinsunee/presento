export interface Slide {
  id: number;
  title: string;
  content: string;
  notes: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
}

export interface SlideComment {
  slide: number;
  comment: string;
}

export interface Feedback {
  slides_comments: SlideComment[];
  overall: string;
  action: "revise" | "approve" | "dismiss";
}

export type TTSEngine = "web-speech" | "openai";

export interface TTSSettings {
  engine: TTSEngine;
  rate: number;
  voice?: string;
  openaiApiKey?: string;
}

export interface SlidesResponse {
  presentation: Presentation;
  origin: string;
}

export interface FeedbackResponse {
  ok: boolean;
}
