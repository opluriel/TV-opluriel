import type { MouseEvent } from "react";
import type { Channel } from "../types";

interface ChannelItemProps {
  channel: Channel;
  active: boolean;
  favorite: boolean;
  onPlay: (channel: Channel) => void;
  onFavoriteToggle: (channel: Channel) => void;
}

export default function ChannelItem({
  channel,
  active,
  favorite,
  onPlay,
  onFavoriteToggle,
}: ChannelItemProps) {
  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onFavoriteToggle(channel);
  };

  return (
    <div
      className={`ch${active ? " active" : ""}`}
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      onClick={() => onPlay(channel)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPlay(channel);
        }
      }}
    >
      <img
        loading="lazy"
        alt=""
        src={channel.logo}
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
      <div className="n">
        <b>{channel.name}</b>
        <small>{channel.group}</small>
      </div>
      <button
        className={`fav${favorite ? " f" : ""}`}
        aria-label={favorite ? `Retirer ${channel.name} des favoris` : `Ajouter ${channel.name} aux favoris`}
        aria-pressed={favorite}
        onClick={handleFavoriteClick}
      >
        <span aria-hidden="true">★</span>
      </button>
    </div>
  );
}
