# Règles du projet

## Contrainte absolue
La logique de lecture des chaînes (fonction play(), usage de hls.js,
fallback v.src natif, gestion des erreurs fatales, MANIFEST_PARSED) ne doit
JAMAIS changer de comportement. Elle est déplacée dans
src/player/playChannel.ts, sans modification de logique.
Le flux vidéo est toujours lu directement par le navigateur depuis l'URL
d'origine : jamais via notre backend.

## Stack
- Frontend : React + TypeScript + Vite
- Backend : Node.js (Fastify ou Express) + TypeScript
- Base de données : SQLite (dev) / Postgres (prod)
- hls.js épinglé à 1.5.17

## Conventions
- Interface en français
- Thème clair/sombre automatique (prefers-color-scheme), conservé
- Pas de nouvelles dépendances sans me le dire
- Petits commits, un par fonctionnalité

iptv-app/
├─ legacy/iptv-player.html        (référence)
├─ client/                        (React + TS + Vite)
│  └─ src/
│     ├─ player/playChannel.ts    (logique de lecture, copiée telle quelle)
│     ├─ components/              (Header, ChannelList, ChannelItem, VideoStage)
│     ├─ hooks/                   (useChannels, useFavorites)
│     └─ api/                     (appels vers le backend)
└─ server/
   ├─ src/routes/channels.ts      (GET /api/channels)
   ├─ src/routes/favorites.ts     (GET/POST/DELETE /api/favorites)
   ├─ src/services/m3uParser.ts   (parse() déplacée côté serveur)
   └─ src/db/