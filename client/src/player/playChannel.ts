import type { Channel } from "../types";

let hls: Hls | null = null;
let current: Channel | null = null;
const $ = (id: string): HTMLElement => document.getElementById(id)!;

export function playChannel(c: Channel, render: (channel: Channel | null) => void): void {
  current = c;
  $("now").textContent = c.name;
  $("status").textContent = "Connexion au flux…";
  const v = $("v") as HTMLVideoElement;
  if (hls) { hls.destroy(); hls = null; }
  if (window.Hls && Hls.isSupported()) {
    hls = new Hls(); hls.loadSource(c.url); hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { v.play().catch(()=>{}); $("status").textContent = "Lecture en cours"; });
    hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) $("status").textContent = "Flux indisponible (hors ligne, géo-bloqué ou bloqué par CORS). Essayez une autre chaîne."; });
  }else{v.src=c.url;v.play().catch(()=>{});$("status").textContent="Lecture en cours"}
  render(current);
}
