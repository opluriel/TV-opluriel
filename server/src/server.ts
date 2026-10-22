import { createServer } from "node:http";
import { createChannelCache } from "./services/channelCache.js";
import { handleChannels } from "./routes/channels.js";
import { FavoritesStore } from "./db/favoritesStore.js";
import { handleFavorites } from "./routes/favorites.js";

const playlistUrl = process.env.M3U_URL || "https://iptv-org.github.io/iptv/index.m3u";
const port = Number(process.env.PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("La variable PORT doit être un port valide.");
}

const getChannels = createChannelCache(async () => {
  const response = await fetch(playlistUrl);
  if (!response.ok) {
    throw new Error(`Échec du chargement de la playlist (${response.status} ${response.statusText}).`);
  }
  return response.text();
});
const favoritesStore = new FavoritesStore(
  process.env.FAVORITES_DB_PATH || undefined,
);

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  if (request.method === "GET" && requestUrl.pathname === "/api/channels") {
    void handleChannels(request, response, getChannels);
    return;
  }
  if (requestUrl.pathname === "/api/favorites") {
    if (request.method === "GET" || request.method === "POST" || request.method === "DELETE") {
      void handleFavorites(request, response, favoritesStore);
      return;
    }
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Méthode non autorisée." }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Route introuvable." }));
});

server.listen(port, () => {
  console.log(`API disponible sur http://localhost:${port}`);
});
