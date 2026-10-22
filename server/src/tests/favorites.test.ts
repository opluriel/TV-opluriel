import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import test from "node:test";
import { FavoritesStore } from "../db/favoritesStore.js";
import { handleFavorites } from "../routes/favorites.js";

async function request(
  store: FavoritesStore,
  method: string,
  body?: string,
): Promise<{ status: number; body: unknown }> {
  const server = createServer((req, res) => {
    void handleFavorites(req, res, store);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/favorites`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body,
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("SQLite stocke les favoris et les routes permettent leur consultation et suppression", async (t) => {
  const store = new FavoritesStore(":memory:");
  t.after(() => store.close());
  const url = "https://example.com/live.m3u8";
  const added = await request(store, "POST", JSON.stringify({ url }));
  assert.equal(added.status, 200);
  assert.deepEqual((added.body as { favorites: string[] }).favorites, [url]);

  const listed = await request(store, "GET");
  assert.equal(listed.status, 200);
  assert.deepEqual((listed.body as { favorites: string[] }).favorites, [url]);

  const removed = await request(store, "DELETE", JSON.stringify({ url }));
  assert.equal(removed.status, 200);
  assert.deepEqual((removed.body as { favorites: string[] }).favorites, []);
});

test("les favoris sont idempotents et refusent les URL non HTTP", async (t) => {
  const store = new FavoritesStore(":memory:");
  t.after(() => store.close());
  const url = "https://example.com/live.m3u8";
  await request(store, "POST", JSON.stringify({ url }));
  const duplicate = await request(store, "POST", JSON.stringify({ url }));
  assert.deepEqual((duplicate.body as { favorites: string[] }).favorites, [url]);

  const invalid = await request(store, "POST", JSON.stringify({ url: "file:///private/data" }));
  assert.equal(invalid.status, 400);
});

test("les routes signalent un JSON mal formé", async (t) => {
  const store = new FavoritesStore(":memory:");
  t.after(() => store.close());
  const result = await request(store, "POST", "{");
  assert.equal(result.status, 400);
});

test("les favoris SQLite restent disponibles après réouverture de la base", () => {
  const directory = mkdtempSync(join(tmpdir(), "iptv-favorites-"));
  const databasePath = join(directory, "favorites.sqlite");

  try {
    const firstStore = new FavoritesStore(databasePath);
    firstStore.add("https://example.com/live.m3u8");
    firstStore.close();

    const reopenedStore = new FavoritesStore(databasePath);
    assert.deepEqual(reopenedStore.list(), ["https://example.com/live.m3u8"]);
    reopenedStore.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
