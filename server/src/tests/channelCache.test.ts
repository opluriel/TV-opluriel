import assert from "node:assert/strict";
import test from "node:test";
import { CHANNEL_CACHE_TTL_MS, createChannelCache } from "../services/channelCache.js";

const playlist = '#EXTINF:-1 group-title="News",Channel\nhttps://example.com/live.m3u8';

test("cache charge une fois jusqu'à expiration après six heures", async () => {
  let time = 0;
  let fetchCount = 0;
  const getChannels = createChannelCache(
    async () => {
      fetchCount++;
      return playlist;
    },
    CHANNEL_CACHE_TTL_MS,
    () => time,
  );

  const first = await getChannels();
  time = CHANNEL_CACHE_TTL_MS - 1;
  assert.equal(await getChannels(), first);
  assert.equal(fetchCount, 1);

  time = CHANNEL_CACHE_TTL_MS;
  await getChannels();
  assert.equal(fetchCount, 2);
});

test("charge une seule fois lorsque plusieurs requêtes arrivent simultanément", async () => {
  let fetchCount = 0;
  const getChannels = createChannelCache(async () => {
    fetchCount++;
    await Promise.resolve();
    return playlist;
  });

  await Promise.all([getChannels(), getChannels(), getChannels()]);
  assert.equal(fetchCount, 1);
});
