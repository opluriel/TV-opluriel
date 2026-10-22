import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "../src/types";

const channel: Channel = {
  name: "Info 24",
  url: "https://example.com/news.m3u8",
  logo: "",
  group: "Actualités",
};

const video = {
  src: "",
  play: vi.fn(() => Promise.resolve()),
};

const now = { textContent: "" };
const status = { textContent: "" };

const loadSource = vi.fn();
const attachMedia = vi.fn();
const on = vi.fn();
const destroy = vi.fn();
const isSupported = vi.fn(() => true);

class FakeHls {
  static Events = {
    MANIFEST_PARSED: "manifestParsed",
    ERROR: "error",
  };

  static isSupported = isSupported;

  loadSource = loadSource;
  attachMedia = attachMedia;
  on = on;
  destroy = destroy;
}

const render = vi.fn();

async function importPlayChannel() {
  vi.resetModules();
  const module = await import("../src/player/playChannel");
  return module.playChannel;
}

describe("playChannel", () => {
  beforeEach(() => {
    video.src = "";
    video.play.mockClear();
    now.textContent = "";
    status.textContent = "";
    loadSource.mockClear();
    attachMedia.mockClear();
    on.mockClear();
    destroy.mockClear();
    isSupported.mockReset();
    isSupported.mockReturnValue(true);
    render.mockClear();

    vi.stubGlobal("Hls", FakeHls);
    vi.stubGlobal("window", { Hls: FakeHls });
    vi.stubGlobal("document", {
      getElementById: (id: string) => {
        if (id === "v") return video;
        if (id === "now") return now;
        if (id === "status") return status;
        return null;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("charge la source HLS et attache le lecteur vidéo", async () => {
    const playChannel = await importPlayChannel();

    playChannel(channel, render);

    expect(loadSource).toHaveBeenCalledWith(channel.url);
    expect(attachMedia).toHaveBeenCalledWith(video);
    expect(video.src).toBe("");
    expect(render).toHaveBeenCalledWith(channel);
  });

  it("lit l'URL directement dans v.src si Hls n'est pas supporté", async () => {
    isSupported.mockReturnValue(false);
    const playChannel = await importPlayChannel();

    playChannel(channel, render);

    expect(loadSource).not.toHaveBeenCalled();
    expect(attachMedia).not.toHaveBeenCalled();
    expect(video.src).toBe(channel.url);
    expect(video.play).toHaveBeenCalledOnce();
    expect(status.textContent).toBe("Lecture en cours");
    expect(render).toHaveBeenCalledWith(channel);
  });
});
