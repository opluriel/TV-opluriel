import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export class FavoritesStore {
  private readonly database: DatabaseSync;

  constructor(
    databasePath = fileURLToPath(new URL("../../data/favorites.sqlite", import.meta.url)),
  ) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        url TEXT PRIMARY KEY,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  list(): string[] {
    const rows = this.database.prepare("SELECT url FROM favorites ORDER BY created_at, url").all();
    return rows.map((row) => {
      if (typeof row.url !== "string") {
        throw new Error("URL de favori invalide dans la base SQLite.");
      }
      return row.url;
    });
  }

  add(url: string): void {
    this.database.prepare("INSERT OR IGNORE INTO favorites (url) VALUES (?)").run(url);
  }

  remove(url: string): void {
    this.database.prepare("DELETE FROM favorites WHERE url = ?").run(url);
  }

  close(): void {
    this.database.close();
  }
}
