const FAVORITES_ENDPOINT = "/api/favorites";

interface ErrorResponse {
  error?: string;
}

async function requestFavorites(method: "GET" | "POST" | "DELETE", url?: string): Promise<string[]> {
  const response = await fetch(FAVORITES_ENDPOINT, {
    method,
    headers: url ? { "Content-Type": "application/json" } : undefined,
    body: url ? JSON.stringify({ url }) : undefined,
  });
  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "error" in result
        ? (result as ErrorResponse).error
        : undefined;
    throw new Error(message || `Erreur HTTP ${response.status}`);
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("favorites" in result) ||
    !Array.isArray(result.favorites) ||
    !result.favorites.every((favorite) => typeof favorite === "string")
  ) {
    throw new Error("Réponse invalide du serveur des favoris.");
  }
  return result.favorites;
}

export function fetchFavorites(): Promise<string[]> {
  return requestFavorites("GET");
}

export function addFavorite(url: string): Promise<string[]> {
  return requestFavorites("POST", url);
}

export function removeFavorite(url: string): Promise<string[]> {
  return requestFavorites("DELETE", url);
}
