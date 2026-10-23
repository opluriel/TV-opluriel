interface HeaderProps {
  onSearchChange: (query: string) => void;
  groups: string[];
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  onlyFavorites: boolean;
  onFavoritesToggle: () => void;
}

export default function Header({
  onSearchChange,
  groups,
  selectedGroup,
  onGroupChange,
  onlyFavorites,
  onFavoritesToggle,
}: HeaderProps) {
  return (
    <header className="app-header">
      {/* <h1 className="brand">
        <span className="brand-mark" aria-hidden="true">▶</span>
        <span>TV Opluriel </span>
      </h1> */}
      <h1 className="brand">
        <img className="brand-mark" src="./assets/tv-opluriel-dark.svg" alt="" aria-hidden="true" />
        <span>TV Opluriel </span>
      </h1>
      <label className="search-wrap">
        <span className="visually-hidden">Rechercher une chaîne</span>
        <input
          id="q"
          type="search"
          placeholder="Rechercher une chaîne…"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <select
        id="grp"
        aria-label="Catégorie"
        value={selectedGroup}
        onChange={(event) => onGroupChange(event.target.value)}
      >
        <option value="">Toutes catégories</option>
        {groups.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
      <button
        id="favBtn"
        className={onlyFavorites ? "on" : ""}
        aria-pressed={onlyFavorites}
        onClick={onFavoritesToggle}
      >
        <span aria-hidden="true">★</span> Favoris
      </button>
    </header>
  );
}
