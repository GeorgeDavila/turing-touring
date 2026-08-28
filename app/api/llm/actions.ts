"use server";

import { openrouterRequest as requestOpenRouter } from "./qwen-instruct";

type OpenRouterRequestOptions = {
  query: string;
  model?: string;
  useWebSearch?: boolean;
  maxTokens?: number;
  reasoning?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
};

export async function openrouterRequest(
  options: OpenRouterRequestOptions,
): Promise<string> {
  return requestOpenRouter(options);
}
