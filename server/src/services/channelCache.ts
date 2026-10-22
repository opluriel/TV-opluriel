import { parse } from "./m3uParser.js";
import type { Channel } from "../types.js";

export const CHANNEL_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function createChannelCache(
  fetchPlaylist: () => Promise<string>,
  ttlMs = CHANNEL_CACHE_TTL_MS,
  now: () => number = Date.now,
): () => Promise<Channel[]> {
  let cachedChannels: Channel[] | undefined;
  let expiresAt = 0;
  let pendingLoad: Promise<Channel[]> | undefined;

  return () => {
    if (cachedChannels && now() < expiresAt) {
      return Promise.resolve(cachedChannels);
    }
    if (pendingLoad) return pendingLoad;

    pendingLoad = fetchPlaylist()
      .then((text) => {
        const channels = parse(text);
        cachedChannels = channels;
        expiresAt = now() + ttlMs;
        return channels;
      })
      .finally(() => {
        pendingLoad = undefined;
      });

    return pendingLoad;
  };
}
