const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";

type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "video_url"; video_url: { url: string } }
  | { type: "audio_url"; audio_url: { url: string } }
  | { type: "file_url"; file_url: { url: string } };

type OpenRouterTool = { type: "openrouter:web_search" };

export type OpenRouterRequestOptions = {
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

type OpenRouterChatResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

function buildContent({
  query,
  imageUrl,
  videoUrl,
  audioUrl,
  fileUrl,
}: OpenRouterRequestOptions): MessageContent[] {
  const content: MessageContent[] = [{ type: "text", text: query }];

  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }
  if (videoUrl) {
    content.push({ type: "video_url", video_url: { url: videoUrl } });
  }
  if (audioUrl) {
    content.push({ type: "audio_url", audio_url: { url: audioUrl } });
  }
  if (fileUrl) {
    content.push({ type: "file_url", file_url: { url: fileUrl } });
  }

  return content;
}

export async function openrouterRequest({
  query,
  model = DEFAULT_MODEL,
  useWebSearch = true,
  maxTokens = 2000,
  reasoning = true,
  imageUrl = null,
  videoUrl = null,
  audioUrl = null,
  fileUrl = null,
}: OpenRouterRequestOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const tools: OpenRouterTool[] = useWebSearch
    ? [{ type: "openrouter:web_search" }]
    : [];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: buildContent({
            query,
            imageUrl,
            videoUrl,
            audioUrl,
            fileUrl,
          }),
        },
      ],
      tools,
      tool_choice: "auto",
      max_tokens: maxTokens,
      reasoning: { enabled: reasoning },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterChatResponse;
  return data.choices[0]?.message?.content ?? "";
}
