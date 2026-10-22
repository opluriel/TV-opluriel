import { useEffect, useState } from "react";
import { fetchAllChannels, fetchChannels } from "./api/channels";
import ChannelList from "./components/ChannelList";
import Header from "./components/Header";
import VideoStage from "./components/VideoStage";
import { useFavorites } from "./hooks/useFavorites";
import { playChannel } from "./player/playChannel";
import type { Channel } from "./types";

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const { favorites, toggleFavorite } = useFavorites();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [current, setCurrent] = useState<Channel | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [status, setStatus] = useState("Chargement de la playlist…");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [groups, setGroups] = useState<string[]>([]);

  const filteredChannels = onlyFavorites
    ? channels.filter((channel) => favorites.has(channel.url))
    : channels;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const request = onlyFavorites
      ? fetchAllChannels(query, selectedGroup, controller.signal)
      : fetchChannels(query, selectedGroup, page, controller.signal);
    request
      .then((result) => {
        setChannels((loaded) =>
          onlyFavorites || page === 1
            ? result.channels
            : [...loaded, ...result.channels],
        );
        setGroups(result.groups);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setLoading(false);
        if (onlyFavorites || page === 1) setStatus(`${result.total} chaînes chargées`);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setLoading(false);
          setStatus(`Erreur de chargement : ${error.message}`);
        }
      });
    return () => controller.abort();
  }, [onlyFavorites, page, query, selectedGroup]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
    setChannels([]);
    setTotal(0);
    setTotalPages(0);
  };

  const updateGroup = (value: string) => {
    setSelectedGroup(value);
    setPage(1);
    setChannels([]);
    setTotal(0);
    setTotalPages(0);
  };

  const toggleOnlyFavorites = () => {
    setOnlyFavorites((value) => !value);
    setPage(1);
  };

  const play = (channel: Channel) => {
    playChannel(channel, setCurrent);
  };

  return (
    <>
      <Header
        onSearchChange={updateQuery}
        groups={groups}
        selectedGroup={selectedGroup}
        onGroupChange={updateGroup}
        onlyFavorites={onlyFavorites}
        onFavoritesToggle={toggleOnlyFavorites}
      />
      <main>
        <VideoStage now={current ? current.name : "Choisissez une chaîne"} status={status} />
        <ChannelList
          channels={filteredChannels}
          total={onlyFavorites ? filteredChannels.length : total}
          hasMore={!onlyFavorites && page < totalPages}
          loading={loading}
          onLoadMore={() => setPage((currentPage) => currentPage + 1)}
          current={current}
          favorites={favorites}
          onPlay={play}
          onFavoriteToggle={toggleFavorite}
        />
      </main>
    </>
  );
}
