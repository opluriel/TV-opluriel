import type { IncomingMessage, ServerResponse } from "node:http";
import type { FavoritesStore } from "../db/favoritesStore.js";

const MAX_BODY_SIZE = 16 * 1024;

class InvalidFavoriteError extends Error {}

async function readUrl(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_SIZE) {
      throw new InvalidFavoriteError("Le corps de la requête est trop volumineux.");
    }
    chunks.push(buffer);
  }

  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new InvalidFavoriteError("Le corps doit être un JSON valide.");
  }

  if (typeof body !== "object" || body === null || !("url" in body)) {
    throw new InvalidFavoriteError("Le champ url est obligatoire.");
  }

  const url = body.url;
  if (typeof url !== "string" || !url.trim()) {
    throw new InvalidFavoriteError("Le champ url doit être une chaîne non vide.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new InvalidFavoriteError("Le champ url doit être une URL valide.");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new InvalidFavoriteError("Seules les URL HTTP et HTTPS sont acceptées.");
  }

  return url;
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function handleFavorites(
  request: IncomingMessage,
  response: ServerResponse,
  store: FavoritesStore,
): Promise<void> {
  try {
    if (request.method === "GET") {
      sendJson(response, 200, { favorites: store.list() });
      return;
    }

    const url = await readUrl(request);
    if (request.method === "POST") {
      store.add(url);
      sendJson(response, 200, { favorites: store.list() });
      return;
    }

    if (request.method === "DELETE") {
      store.remove(url);
      sendJson(response, 200, { favorites: store.list() });
      return;
    }

    sendJson(response, 405, { error: "Méthode non autorisée." });
  } catch (error) {
    const status = error instanceof InvalidFavoriteError ? 400 : 500;
    const message =
      error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    sendJson(response, status, { error: message });
  }
}
