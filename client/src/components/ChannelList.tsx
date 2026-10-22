import type { Channel } from "../types";
import ChannelItem from "./ChannelItem";

interface ChannelListProps {
  channels: Channel[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  current: Channel | null;
  favorites: Set<string>;
  onPlay: (channel: Channel) => void;
  onFavoriteToggle: (channel: Channel) => void;
}

export default function ChannelList({
  channels,
  total,
  hasMore,
  loading,
  onLoadMore,
  current,
  favorites,
  onPlay,
  onFavoriteToggle,
}: ChannelListProps) {
  return (
    <aside id="list">
      <div className="list-heading">
        <h2>Chaînes</h2>
        <div id="count">{total} chaîne(s)</div>
      </div>
      {loading && channels.length === 0 ? (
        <div className="skeleton-list" aria-label="Chargement des chaînes" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="skeleton-row" key={index} aria-hidden="true">
              <div className="skeleton-logo" />
              <div className="skeleton-copy">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">⌕</span>
          <strong>Aucune chaîne trouvée</strong>
          <p>Essayez une autre recherche ou sélectionnez une autre catégorie.</p>
        </div>
      ) : (
        <div id="items">
          {channels.map((channel, index) => (
            <ChannelItem
              key={`${channel.url}-${index}`}
              channel={channel}
              active={Boolean(current && current.url === channel.url)}
              favorite={favorites.has(channel.url)}
              onPlay={onPlay}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      )}
      {hasMore && (
        <button id="loadMore" onClick={onLoadMore} disabled={loading}>
          Afficher les 500 suivantes
        </button>
      )}
    </aside>
  );
}
