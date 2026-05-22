import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import { StarRating } from '../components/StarRating';
import { RatingPromptModal } from '../components/RatingPromptModal';
import { Bookmark, Eye, Clock, Star, Search, CheckCircle2, Trash2, SlidersHorizontal, List, History, Plus, X, Calendar } from 'lucide-react';
import type { Movie } from '../lib/types';

export function MyList() {
  const {
    movies,
    removeMovie,
    updateRating,
    userLists,
    createUserList,
    deleteUserList,
    removeMovieFromList,
    watchLogs,
    removeWatchLog
  } = useStore();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched' | 'custom' | 'diary'>('watchlist');
  const [filterGenre, setFilterGenre] = useState('All');
  const [filterDirector, setFilterDirector] = useState('All');
  const [filterDecade, setFilterDecade] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [ratingPromptMovie, setRatingPromptMovie] = useState<Movie | null>(null);

  // Custom list states
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [showCreateListModal, setShowCreateListModal] = useState(false);

  const tabMovies = useMemo(() => movies.filter(m => m.status === (activeTab === 'watchlist' || activeTab === 'watched' ? activeTab : 'watchlist')), [movies, activeTab]);

  const allGenres = useMemo(() => {
    const g = new Set<string>();
    tabMovies.forEach(m => m.genres.forEach(genre => g.add(genre)));
    return ['All', ...Array.from(g).sort()];
  }, [tabMovies]);

  const allDirectors = useMemo(() => {
    const d = new Set<string>();
    tabMovies.forEach(m => m.directors.forEach(dir => d.add(dir)));
    return ['All', ...Array.from(d).sort()];
  }, [tabMovies]);

  const allDecades = useMemo(() => {
    const d = new Set<string>();
    tabMovies.forEach(m => {
      if (m.release_date) {
        const year = parseInt(m.release_date.substring(0, 4));
        const decade = `${Math.floor(year / 10) * 10}s`;
        d.add(decade);
      }
    });
    return ['All', ...Array.from(d).sort().reverse()];
  }, [tabMovies]);

  const filteredMovies = useMemo(() => {
    return tabMovies.filter(m => {
      if (filterGenre !== 'All' && !m.genres.includes(filterGenre)) return false;
      if (filterDirector !== 'All' && !m.directors.includes(filterDirector)) return false;
      if (filterDecade !== 'All') {
        const year = parseInt(m.release_date?.substring(0, 4) || '0');
        const decade = `${Math.floor(year / 10) * 10}s`;
        if (decade !== filterDecade) return false;
      }
      if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tabMovies, filterGenre, filterDirector, filterDecade, searchQuery]);

  // Selected custom list object
  const activeCustomList = useMemo(() => {
    return userLists.find(l => l.id === selectedListId) || null;
  }, [userLists, selectedListId]);

  // Movies in the active custom list
  const customListMovies = useMemo(() => {
    if (!activeCustomList) return [];
    return movies.filter(m => activeCustomList.movieIds.includes(m.id));
  }, [movies, activeCustomList]);

  // Watch logs sorted by date descending
  const sortedWatchLogs = useMemo(() => {
    return [...watchLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [watchLogs]);

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createUserList(newListName.trim(), newListDesc.trim() || 'No description');
    setNewListName('');
    setNewListDesc('');
    setShowCreateListModal(false);
  };

  return (
    <div className="py-8 pb-20">
      <div className="px-6 lg:px-10 mb-8">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-2">
          📋 Track & Organize
        </motion.h1>
        <p className="text-muted-light">Keep tabs on what you’ve watched, what you want to watch, custom lists, and diary logs.</p>
      </div>

      <div className="px-6 lg:px-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex p-1 rounded-xl bg-surface border border-border flex-wrap">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'watchlist' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'}`}
            >
              <Bookmark size={14} /> Watchlist
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">{movies.filter(m => m.status === 'watchlist').length}</span>
            </button>
            <button
              onClick={() => setActiveTab('watched')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'watched' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'}`}
            >
              <Eye size={14} /> Watched
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">{movies.filter(m => m.status === 'watched').length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('custom'); setSelectedListId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'custom' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'}`}
            >
              <List size={14} /> Custom Lists
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">{userLists.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'diary' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'}`}
            >
              <History size={14} /> Watch Diary
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">{watchLogs.length}</span>
            </button>
          </div>

          {(activeTab === 'watchlist' || activeTab === 'watched') && (
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-medium border transition-all ${showFilters ? 'bg-primary/15 text-primary border-primary/30' : 'bg-surface text-muted-light border-border hover:text-white'}`}>
              <SlidersHorizontal size={14} /> Filters
            </button>
          )}

          {activeTab === 'custom' && !selectedListId && (
            <button
              onClick={() => setShowCreateListModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <Plus size={14} /> Create List
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (activeTab === 'watchlist' || activeTab === 'watched') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="p-4 glass-light rounded-xl space-y-4 border border-white/5">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your list..."
                    className="w-full py-2 pl-10 pr-4 text-xs bg-surface border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-[10px] text-muted uppercase tracking-wider mb-1 font-semibold">Genre</label>
                    <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50">
                      {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted uppercase tracking-wider mb-1 font-semibold">Director</label>
                    <select value={filterDirector} onChange={(e) => setFilterDirector(e.target.value)} className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50">
                      {allDirectors.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted uppercase tracking-wider mb-1 font-semibold">Decade</label>
                    <select value={filterDecade} onChange={(e) => setFilterDecade(e.target.value)} className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50">
                      {allDecades.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Renderers */}
        <AnimatePresence mode="wait">
          {/* Watchlist & Watched Tab */}
          {(activeTab === 'watchlist' || activeTab === 'watched') && (
            <motion.div
              key="grids"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMovies.map((movie) => (
                  <motion.div
                    layout
                    key={movie.id}
                    className="card-poster group cursor-pointer"
                    onClick={() => navigate(`/details/${movie.media_type || 'movie'}/${movie.id}`)}
                  >
                    <div className="relative aspect-[2/3] bg-surface-light rounded-xl overflow-hidden">
                      {movie.poster_path ? (
                        <img src={IMG.poster(movie.poster_path, 'w342')!} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-xs p-3 text-center bg-surface-light">{movie.title}</div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 gap-2">
                        {activeTab === 'watchlist' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setRatingPromptMovie(movie); }}
                            className="flex items-center justify-center gap-1.5 w-full py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition-all"
                          >
                            <CheckCircle2 size={14} /> Mark Watched
                          </button>
                        ) : (
                          <div onClick={(e) => e.stopPropagation()} className="mb-1">
                            <StarRating rating={movie.user_rating || 0} onRate={(r) => updateRating(movie.id, r)} interactive />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMovie(movie.id); }}
                          className="flex items-center justify-center gap-1.5 w-full py-2 bg-danger/25 text-danger rounded-lg text-[11px] font-semibold hover:bg-danger/35 transition-all"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>

                      {movie.user_rating && movie.user_rating > 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 text-[11px] font-semibold text-gold backdrop-blur-sm">
                          <Star size={10} className="fill-gold" /> {movie.user_rating}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 px-1">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{movie.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-light">
                        <span>{movie.release_date?.substring(0, 4)}</span>
                        {movie.runtime && <span className="flex items-center gap-0.5"><Clock size={10} />{movie.runtime}m</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredMovies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                    <Bookmark size={24} className="text-muted" />
                  </div>
                  <p className="text-lg font-bold text-white mb-1">
                    {tabMovies.length === 0 ? `Your ${activeTab} is empty` : 'No results match filters'}
                  </p>
                  <p className="text-xs text-muted-light max-w-xs">
                    {tabMovies.length === 0 ? 'Search for movies/TV shows or check home trending rows to add items!' : 'Try clearing search or filters.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Custom Lists Tab */}
          {activeTab === 'custom' && (
            <motion.div
              key="custom-lists"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              {activeCustomList ? (
                <div>
                  {/* Selected List Detail View */}
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setSelectedListId(null)}
                      className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-muted hover:text-white transition-all"
                    >
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-white">{activeCustomList.name}</h2>
                      <p className="text-xs text-muted-light">{activeCustomList.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {customListMovies.map((movie) => (
                      <div key={movie.id} className="card-poster group relative">
                        <div className="relative aspect-[2/3] bg-surface-light rounded-xl overflow-hidden cursor-pointer" onClick={() => navigate(`/details/${movie.media_type || 'movie'}/${movie.id}`)}>
                          {movie.poster_path ? (
                            <img src={IMG.poster(movie.poster_path, 'w342')!} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted text-xs p-3 text-center">{movie.title}</div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeMovieFromList(activeCustomList.id, movie.id); }}
                              className="px-3 py-1.5 bg-danger text-white rounded-lg text-xs font-semibold hover:bg-danger-dark transition-all flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-medium text-white truncate mt-2 px-1">{movie.title}</h3>
                      </div>
                    ))}
                  </div>

                  {customListMovies.length === 0 && (
                    <div className="text-center py-16 text-muted-light">
                      <p className="text-sm font-medium">This custom list is empty.</p>
                      <p className="text-xs mt-1">Visit any movie or TV show detail page to add it to this list.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Grid of custom lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userLists.map(list => (
                      <div
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className="p-5 glass-light hover:bg-white/10 rounded-2xl border border-white/5 cursor-pointer group flex items-start justify-between transition-all"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <List size={16} /> {list.name}
                          </h3>
                          <p className="text-xs text-muted-light mt-1.5 line-clamp-2">{list.description}</p>
                          <span className="inline-block mt-3 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            {list.movieIds.length} Title{list.movieIds.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteUserList(list.id); }}
                          className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                          title="Delete List"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {userLists.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border border-white/5">
                        <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-3">
                          <List size={24} className="text-muted" />
                        </div>
                        <p className="text-base font-bold text-white mb-1">No Custom Lists</p>
                        <p className="text-xs text-muted-light max-w-xs mb-4">Organize your movies into custom categories like "Masterpieces" or "Rewatch comfort".</p>
                        <button
                          onClick={() => setShowCreateListModal(true)}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all"
                        >
                          Create First List
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Watch Diary History Tab */}
          {activeTab === 'diary' && (
            <motion.div
              key="diary-logs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {sortedWatchLogs.length > 0 ? (
                <div className="glass-light rounded-2xl overflow-hidden border border-white/5">
                  <div className="divide-y divide-white/5">
                    {sortedWatchLogs.map((log) => (
                      <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                        <div className="flex gap-3">
                          {/* Mini poster */}
                          <div className="w-10 h-14 bg-surface rounded overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/details/${log.mediaType || 'movie'}/${log.movieId}`)}>
                            {log.posterPath ? (
                              <img src={IMG.poster(log.posterPath, 'w92')!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-surface-light text-[8px] text-muted text-center">No IMG</div>
                            )}
                          </div>
                          <div>
                            <h4
                              onClick={() => navigate(`/details/${log.mediaType || 'movie'}/${log.movieId}`)}
                              className="text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              {log.movieTitle}
                              {log.rewatch && (
                                <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                                  ↻ Rewatch
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-light mt-1">
                              <Calendar size={12} />
                              <span>{new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            {log.review && (
                              <p className="text-xs text-gray-400 italic mt-2 border-l-2 border-primary/40 pl-2">
                                "{log.review}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <div className="flex items-center gap-1 bg-black/35 px-2.5 py-1 rounded-xl border border-white/5">
                            <StarRating rating={log.rating} size={14} interactive={false} />
                          </div>
                          <button
                            onClick={() => removeWatchLog(log.id)}
                            className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                            title="Remove log entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-3">
                    <History size={24} className="text-muted" />
                  </div>
                  <p className="text-base font-bold text-white mb-1">Watch Diary Empty</p>
                  <p className="text-xs text-muted-light max-w-xs">When you mark a movie as watched or log rewatches, they will be logged chronologically here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating Prompt Modal */}
      {ratingPromptMovie && (
        <RatingPromptModal movie={ratingPromptMovie} onClose={() => setRatingPromptMovie(null)} />
      )}

      {/* Create List Modal */}
      <AnimatePresence>
        {showCreateListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 glass-panel rounded-2xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowCreateListModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-white"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-lg font-bold text-white mb-4">Create Custom List</h3>
              
              <form onSubmit={handleCreateListSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">List Name</label>
                  <input
                    type="text"
                    required
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. Masterpieces, Comfort Movies..."
                    className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={newListDesc}
                    onChange={(e) => setNewListDesc(e.target.value)}
                    placeholder="Provide a description..."
                    className="w-full h-20 p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateListModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all"
                  >
                    Create List
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
