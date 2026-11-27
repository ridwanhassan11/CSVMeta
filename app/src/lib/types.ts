export type Provider = "gemini" | "groq" | "mistral" | "openai" | "openrouter";

export type GeminiModel =
  | "gemini-3.8-flash"
  | "gemini-3.5-flash"
  | "gemini-3.5-flash-lite"
  | "gemini-3.1-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro";

export type GroqModel =
  | "qwen/qwen3.8-27b"
  | "meta-llama/llama-4-scout-17b-16e-instruct"
  | "meta-llama/llama-4-maverick-17b-128e-instruct";

export type MistralModel =
  | "mistral-small-latest"
  | "pixtral-12b-2409"
  | "mistral-medium-latest"
  | "pixtral-large-latest";

export type OpenAIModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4.1-mini";

export type Platform =
  | "general"
  | "adobe-stock"
  | "shutterstock"
  | "freepik"
  | "vecteezy"
  | "pond5";

export type Mode = "metadata" | "prompt";

export type GenerationSettings = {
  provider: Provider;
  geminiModel: GeminiModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  openaiModel: OpenAIModel;
  openrouterModel: string;
  mode: Mode;
  platform: Platform;
  titleLength: number;
  keywordsCount: number;
  extraInstructions: string;
  parallel: boolean;
  delayMs: number;
  batchSize: 1 | 3;
  smartFallback: boolean;
};

export const DEFAULT_SETTINGS: GenerationSettings = {
  provider: "gemini",
  geminiModel: "gemini-3.8-flash",
  groqModel: "qwen/qwen3.8-27b",
  mistralModel: "mistral-small-latest",
  openaiModel: "gpt-4o",
  openrouterModel: "google/gemini-2.5-flash",
  mode: "metadata",
  platform: "general",
  titleLength: 140,
  keywordsCount: 43,
  extraInstructions: "",
  parallel: false,
  delayMs: 4500,
  batchSize: 3,
  smartFallback: true,
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: "Google Gemini",
  groq: "Groq",
  mistral: "Mistral AI",
  openai: "OpenAI",
  openrouter: "OpenRouter",
};

export const GEMINI_MODELS: { id: GeminiModel; label: string }[] = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (High Quota / Fast)" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Legacy)" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite (Legacy)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Legacy)" },
];

export const GROQ_MODELS: { id: GroqModel; label: string }[] = [
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B" },
];

export const MISTRAL_MODELS: { id: MistralModel; label: string }[] = [
  { id: "mistral-small-latest", label: "Mistral Small Vision (Free)" },
  { id: "pixtral-12b-2409", label: "Pixtral 12B (Free)" },
  { id: "mistral-medium-latest", label: "Mistral Medium Vision" },
  { id: "pixtral-large-latest", label: "Pixtral Large" },
];

export const OPENAI_MODELS: { id: OpenAIModel; label: string }[] = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
];

export const PLATFORMS: {
  id: Platform;
  label: string;
  defaultTitleLength: number;
  maxTitleLength: number;
  defaultKeywordsCount: number;
  maxKeywordsCount: number;
  csvHint: string;
}[] = [
  {
    id: "general",
    label: "General",
    defaultTitleLength: 140,
    maxTitleLength: 200,
    defaultKeywordsCount: 43,
    maxKeywordsCount: 50,
    csvHint: "Filename, Title, Description, Keywords",
  },
  {
    id: "adobe-stock",
    label: "Adobe Stock",
    defaultTitleLength: 70,
    maxTitleLength: 200,
    defaultKeywordsCount: 45,
    maxKeywordsCount: 49,
    csvHint: "Filename, Title, Keywords, Category, Releases",
  },
  {
    id: "shutterstock",
    label: "Shutterstock",
    defaultTitleLength: 150,
    maxTitleLength: 200,
    defaultKeywordsCount: 45,
    maxKeywordsCount: 50,
    csvHint: "Filename, Description, Keywords, Categories, Illustration, Mature Content, Editorial",
  },
  {
    id: "freepik",
    label: "Freepik",
    defaultTitleLength: 100,
    maxTitleLength: 100,
    defaultKeywordsCount: 35,
    maxKeywordsCount: 50,
    csvHint: "filename;title;tags (Semicolon CSV)",
  },
  {
    id: "vecteezy",
    label: "Vecteezy",
    defaultTitleLength: 120,
    maxTitleLength: 200,
    defaultKeywordsCount: 35,
    maxKeywordsCount: 50,
    csvHint: "Filename, Title, Description, Keywords",
  },
  {
    id: "pond5",
    label: "Pond5",
    defaultTitleLength: 80,
    maxTitleLength: 80,
    defaultKeywordsCount: 40,
    maxKeywordsCount: 50,
    csvHint: "OriginalFilename, Title, Description, Keywords, Category, ClipType",
  },
];

export function getCurrentModelLabel(settings: GenerationSettings): string {
  switch (settings.provider) {
    case "gemini":
      return settings.geminiModel;
    case "groq":
      return settings.groqModel;
    case "mistral":
      return settings.mistralModel;
    case "openai":
      return settings.openaiModel;
    case "openrouter":
      return settings.openrouterModel || "কোনো মডেল সেট করা নেই";
    default:
      return "";
  }
}
