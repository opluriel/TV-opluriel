import { useEffect, useState } from "react";

interface VideoStageProps {
  now: string;
  status: string;
}

export default function VideoStage({ now, status }: VideoStageProps) {
  const [cinemaMode, setCinemaMode] = useState(false);

  useEffect(() => {
    if (!cinemaMode) return;
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCinemaMode(false);
    };
    window.addEventListener("keydown", exitOnEscape);
    return () => window.removeEventListener("keydown", exitOnEscape);
  }, [cinemaMode]);

  return (
    <section id="stage" className={cinemaMode ? "cinema-mode" : ""}>
      <div className="video-wrap">
        <video id="v" controls autoPlay playsInline />
      </div>
      <div className="stage-info">
        <div className="stage-copy">
          <h2 id="now">{now}</h2>
          <div id="status">{status}</div>
        </div>
        <button
          className={cinemaMode ? "cinema-close" : "cinema-toggle"}
          aria-pressed={cinemaMode}
          aria-label={cinemaMode ? "Quitter le mode cinéma" : "Activer le mode cinéma"}
          onClick={() => setCinemaMode((active) => !active)}
        >
          <span aria-hidden="true">{cinemaMode ? "×" : "⛶"}</span>
          {cinemaMode ? "Quitter" : "Mode cinéma"}
        </button>
      </div>
    </section>
  );
}
