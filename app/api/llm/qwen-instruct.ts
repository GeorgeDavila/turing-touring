const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";

const SYSTEM_PROMPT = `Only stop when you find an exact link meeting my requirements. 
Only return the precise link, date, time, price, description, google maps link, and location coordinates (latitude and longitude) in JSON format with the keys "link", "date", "time", "price", "description", "location", and "google_maps_link". 
Do not include any other text in your response. 
Put the date in the format "YYYY-MM-DD". Is the date the target date? If not, drop the result.
Use the local time displayed on event pages as the time.
Find the google maps link by searching for the address of the event in google maps.
Extract the latitude and longitude from the google maps link.
If you cannot find a link, return {"link": "", "date": "", "time": "", "price": 0, "description": "", "google_maps_link": "", "location": {"latitude": 0, "longitude": 0} } in JSON format.`;

type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "video_url"; video_url: { url: string } }
  | { type: "audio_url"; audio_url: { url: string } }
  | { type: "file_url"; file_url: { url: string } };

type OpenRouterTool = { type: "openrouter:web_search" };

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
  const content: MessageContent[] = [{ type: "text", text: query}];

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
  maxTokens = 4000,
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

  const tools = [{type: "openrouter:datetime"}]
  if (useWebSearch) {
    tools.push({type: "openrouter:web_search"})
  }

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
      system: SYSTEM_PROMPT,
      max_tokens: maxTokens,
      reasoning: { enabled: reasoning },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterChatResponse;
  console.log("OpenRouter API response:", JSON.stringify(data, null, 2));
  return data.choices[0]?.message?.content ?? "";
}
