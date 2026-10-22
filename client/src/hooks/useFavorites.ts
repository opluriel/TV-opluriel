import { useCallback, useEffect, useRef, useState } from "react";
import { addFavorite, fetchFavorites, removeFavorite } from "../api/favorites";
import type { Channel } from "../types";

const STORAGE_KEY = "favs";

function readLocalFavorites(): Set<string> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored) && stored.every((url) => typeof url === "string")) {
      return new Set(stored);
    }
    console.warn("Les favoris enregistrés localement ont un format invalide.");
  } catch (error) {
    console.warn("Impossible de lire les favoris locaux.", error);
  }
  return new Set();
}

function saveLocalFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch (error) {
    console.error("Impossible d’enregistrer les favoris localement.", error);
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readLocalFavorites);
  const favoritesRef = useRef(favorites);
  const apiAvailable = useRef(false);
  const mutations = useRef(Promise.resolve());

  const updateFavorites = useCallback((next: Set<string>) => {
    favoritesRef.current = next;
    setFavorites(next);
  }, []);

  useEffect(() => {
    let active = true;

    const loadFavorites = async () => {
      try {
        const remoteFavorites = new Set(await fetchFavorites());
        if (!active) return;

        const legacyFavorites = new Set([
          ...readLocalFavorites(),
          ...favoritesRef.current,
        ]);
        const mergedFavorites = new Set([...remoteFavorites, ...legacyFavorites]);
        updateFavorites(mergedFavorites);
        apiAvailable.current = true;

        const migration = mutations.current.then(async () => {
          for (const url of legacyFavorites) {
            if (!remoteFavorites.has(url)) await addFavorite(url);
          }
        });
        mutations.current = migration.catch((error: unknown) => {
          apiAvailable.current = false;
          saveLocalFavorites(favoritesRef.current);
          console.warn("API des favoris indisponible, utilisation du stockage local.", error);
        });
        await mutations.current;

        if (active && apiAvailable.current) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (error) {
            console.warn("Impossible de nettoyer les anciens favoris locaux.", error);
          }
        }
      } catch (error) {
        if (!active) return;
        apiAvailable.current = false;
        updateFavorites(readLocalFavorites());
        console.warn("API des favoris indisponible, utilisation du stockage local.", error);
      }
    };

    void loadFavorites();
    return () => {
      active = false;
    };
  }, [updateFavorites]);

  const toggleFavorite = useCallback(
    (channel: Channel) => {
      const nextFavorites = new Set(favoritesRef.current);
      const adding = !nextFavorites.has(channel.url);
      if (adding) {
        nextFavorites.add(channel.url);
      } else {
        nextFavorites.delete(channel.url);
      }
      updateFavorites(nextFavorites);

      if (!apiAvailable.current) {
        saveLocalFavorites(nextFavorites);
        return;
      }

      mutations.current = mutations.current.then(async () => {
        if (!apiAvailable.current) {
          saveLocalFavorites(favoritesRef.current);
          return;
        }

        try {
          if (adding) {
            await addFavorite(channel.url);
          } else {
            await removeFavorite(channel.url);
          }
        } catch (error) {
          apiAvailable.current = false;
          saveLocalFavorites(favoritesRef.current);
          console.warn("Échec de synchronisation des favoris, utilisation du stockage local.", error);
        }
      });
    },
    [updateFavorites],
  );

  return { favorites, toggleFavorite };
}
