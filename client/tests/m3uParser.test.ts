import { describe, expect, it } from "vitest";
import { parse } from "../../server/src/services/m3uParser";

describe("parse", () => {
  it("parse les chaînes d'un extrait M3U", () => {
    const playlist = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-logo="https://example.com/news.png" group-title="Actualités",Info 24',
      "https://example.com/news.m3u8",
      '#EXTINF:-1 group-title="Cinéma", Film HD',
      "https://example.com/movie.m3u8",
      "",
    ].join("\n");

    expect(parse(playlist)).toEqual([
      {
        name: "Info 24",
        url: "https://example.com/news.m3u8",
        logo: "https://example.com/news.png",
        group: "Actualités",
      },
      {
        name: "Film HD",
        url: "https://example.com/movie.m3u8",
        logo: "",
        group: "Cinéma",
      },
    ]);
  });
});
