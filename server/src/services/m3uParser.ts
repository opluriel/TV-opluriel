import type { Channel } from "../types.js";

export function parse(txt: string): Channel[] {
  const out: Channel[] = [];
  const lines = txt.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith("#EXTINF")) continue;
    const attr = (k: string) => (l.match(new RegExp(k + '="([^"]*)"')) || [])[1] || "";
    const name = l.slice(l.lastIndexOf(",") + 1).trim();
    let j = i + 1;
    while (j < lines.length && (lines[j].startsWith("#") || !lines[j].trim())) j++;
    const url = (lines[j] || "").trim();
    if (url.startsWith("http")) {
      out.push({ name, url, logo: attr("tvg-logo"), group: attr("group-title") || "Autres" });
    }
  }
  return out;
}
