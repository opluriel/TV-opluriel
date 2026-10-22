import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { handleChannels } from "../routes/channels.js";
import type { Channel, ChannelsResponse } from "../types.js";

const channels: Channel[] = [
  { name: "Canal 1", url: "https://example.com/1", logo: "", group: "News;Local" },
  { name: "Canal 2", url: "https://example.com/2", logo: "", group: "Sports" },
  { name: "Canal 3", url: "https://example.com/3", logo: "", group: "News" },
];

async function request(
  path: string,
  channelList: Channel[] = channels,
): Promise<{ status: number; body: unknown }> {
  const server = createServer((req, res) => {
    void handleChannels(req, res, async () => channelList);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/channels filtre par texte et groupe", async () => {
  const result = await request("/api/channels?q=CANAL&group=News");
  assert.equal(result.status, 200);
  const body = result.body as ChannelsResponse;
  assert.deepEqual(body.channels.map((channel) => channel.name), ["Canal 1", "Canal 3"]);
  assert.deepEqual(body.groups, ["Local", "News", "Sports"]);
});

test("GET /api/channels accepte un numéro de page", async () => {
  const channelList = Array.from({ length: 501 }, (_, index) => ({
    name: `Canal ${index + 1}`,
    url: `https://example.com/${index + 1}`,
    logo: "",
    group: "News",
  }));
  const result = await request("/api/channels?page=2", channelList);
  assert.equal(result.status, 200);
  const body = result.body as ChannelsResponse;
  assert.equal(body.page, 2);
  assert.equal(body.total, 501);
  assert.equal(body.channels.length, 1);
  assert.equal(body.channels[0].name, "Canal 501");
});

test("GET /api/channels rejette les numéros de page invalides", async () => {
  const result = await request("/api/channels?page=0");
  assert.equal(result.status, 400);
});
