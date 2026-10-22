import type { IncomingMessage, ServerResponse } from "node:http";
import type { Channel, ChannelsResponse } from "../types.js";

export const CHANNELS_PAGE_SIZE = 500;

export class InvalidQueryError extends Error {}

function getPage(value: string | null): number {
  if (value === null) return 1;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new InvalidQueryError("Le paramètre page doit être un entier positif.");
  }
  const page = Number(value);
  if (!Number.isSafeInteger(page)) {
    throw new InvalidQueryError("Le paramètre page est trop grand.");
  }
  return page;
}

function getGroups(channels: Channel[]): string[] {
  const groups = new Set<string>();
  channels.forEach((channel) => channel.group.split(";").forEach((group) => groups.add(group)));
  return [...groups].sort();
}

export async function handleChannels(
  request: IncomingMessage,
  response: ServerResponse,
  getChannels: () => Promise<Channel[]>,
): Promise<void> {
  try {
    const requestUrl = new URL(request.url || "/api/channels", "http://localhost");
    const query = requestUrl.searchParams.get("q")?.toLowerCase() || "";
    const group = requestUrl.searchParams.get("group") || "";
    const page = getPage(requestUrl.searchParams.get("page"));

    const allChannels = await getChannels();
    const filteredChannels = allChannels.filter(
      (channel) =>
        (!group || channel.group.split(";").includes(group)) &&
        (!query || channel.name.toLowerCase().includes(query)),
    );
    const total = filteredChannels.length;
    const totalPages = Math.ceil(total / CHANNELS_PAGE_SIZE);
    const result: ChannelsResponse = {
      channels: filteredChannels.slice(
        (page - 1) * CHANNELS_PAGE_SIZE,
        page * CHANNELS_PAGE_SIZE,
      ),
      groups: getGroups(allChannels),
      page,
      pageSize: CHANNELS_PAGE_SIZE,
      total,
      totalPages,
    };

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InvalidQueryError ? 400 : 502;
    const message =
      error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: message }));
  }
}
