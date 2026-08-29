"use server";

import { openrouterRequest as requestOpenRouter } from "./web-search-instruct";

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

export async function openrouterRequestJson(
  options: OpenRouterRequestOptions,
): Promise<{ link: string, date: string, time: string, price: number, description: string, google_maps_link: string, location: { latitude: number, longitude: number } }> {
  const response = await requestOpenRouter(options);
  if (!response) {
    return { link: "", date: "", time: "", price: 0, description: "", google_maps_link: "", location: { latitude: 0, longitude: 0 } };
  }
  try {
    const json = JSON.parse(response);
    return {
      link: json.link ?? "",
      date: json.date ?? "",
      time: json.time ?? "",
      price: json.price ?? 0,
      description: json.description ?? "",
      google_maps_link: json.google_maps_link ?? "",
      location: { latitude: json.location.latitude ?? 0, longitude: json.location.longitude ?? 0 },
    };
  } catch (error) {
    console.error(error);
    return { link: "", date: "", time: "", price: 0, description: "", google_maps_link: "", location: { latitude: 0, longitude: 0 } };
  }
}