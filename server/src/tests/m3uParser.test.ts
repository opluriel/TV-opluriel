import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "../services/m3uParser.js";

test("parse conserve les champs des chaînes et les valeurs par défaut", () => {
  const playlist = [
    '#EXTINF:-1 tvg-logo="https://example.com/logo.png" group-title="News;Local",  Canal test  ',
    "# commentaire",
    "",
    "https://example.com/live.m3u8",
    '#EXTINF:-1,Canal sans groupe',
    "https://example.com/other.m3u8",
    '#EXTINF:-1,URL ignorée',
    "ftp://example.com/live",
  ].join("\n");

  assert.deepEqual(parse(playlist), [
    {
      name: "Canal test",
      url: "https://example.com/live.m3u8",
      logo: "https://example.com/logo.png",
      group: "News;Local",
    },
    {
      name: "Canal sans groupe",
      url: "https://example.com/other.m3u8",
      logo: "",
      group: "Autres",
    },
  ]);
});
