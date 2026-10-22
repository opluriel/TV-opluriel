import type { Channel } from "../types";

export interface ChannelsResponse {
  channels: Channel[];
  groups: string[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ChannelsError {
  error?: string;
}

export async function fetchChannels(
  query: string,
  group: string,
  page: number,
  signal: AbortSignal,
): Promise<ChannelsResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("q", query);
  if (group) params.set("group", group);

  const response = await fetch(`/api/channels?${params}`, { signal });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "error" in result
        ? (result as ChannelsError).error
        : undefined;
    throw new Error(message || `Erreur HTTP ${response.status}`);
  }
  return result as ChannelsResponse;
}

export async function fetchAllChannels(
  query: string,
  group: string,
  signal: AbortSignal,
): Promise<ChannelsResponse> {
  const firstPage = await fetchChannels(query, group, 1, signal);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      fetchChannels(query, group, index + 2, signal),
    ),
  );
  return {
    ...firstPage,
    channels: [firstPage, ...remainingPages].flatMap((result) => result.channels),
  };
}
