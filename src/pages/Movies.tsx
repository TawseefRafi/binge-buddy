import { useState, useEffect, useCallback } from 'react';
import { tmdbApi, IMG } from '../lib/tmdb';
import { useStore } from '../store/useStore';
import { ContentRow } from '../components/ContentRow';
import { MagicSearch } from '../components/MagicSearch';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, Check, Loader2, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMovieIdsByAward } from '../lib/awardsData';

export function MoviesPage() {
  const { apiKey, addToWatchlist, isInList } = useStore();
  const navigate = useNavigate();
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [nowPlaying, setNowPlaying] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  // Advanced Filters State
  const [filtersActive, setFiltersActive] = useState(false);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    Promise.allSettled([
      tmdbApi.getTrending('movie', 'week', apiKey).then(setTrending),
      tmdbApi.getPopular('movie', apiKey).then(setPopular),
      tmdbApi.getTopRated('movie', apiKey).then(setTopRated),
      tmdbApi.getNowPlaying(apiKey).then(setNowPlaying),
      tmdbApi.getUpcoming(apiKey).then(setUpcoming),
    ]);
  }, [apiKey]);

  const handleApplyFilters = async (filters: {
    genre?: string;
    country?: string;
    castId?: string;
    directorId?: string;
    prize?: string;
  }) => {
    if (!apiKey) return;
    setLoadingFilters(true);
    try {
      const awardMovieIds = filters.prize ? getMovieIdsByAward(filters.prize as any) : null;
      const isOnlyPrizeActive = !!filters.prize && !filters.genre && !filters.country && !filters.castId && !filters.directorId;

      if (isOnlyPrizeActive && awardMovieIds) {
        const detailsPromises = awardMovieIds.map(async (movieId) => {
          try {
            return await tmdbApi.getDetails(movieId, 'movie', apiKey);
          } catch (e) {
            console.error(`Failed to fetch details for movie ${movieId}:`, e);
            return null;
          }
        });
        const detailsResults = await Promise.all(detailsPromises);
        const validResults = detailsResults.filter(Boolean);
        setFilteredResults(validResults);
        setFiltersActive(true);
      } else {
        const params: Record<string, string> = {};
        if (filters.genre) params.with_genres = filters.genre;
        if (filters.country) params.with_origin_country = filters.country;
        if (filters.castId) params.with_cast = filters.castId;
        if (filters.directorId) params.with_crew = filters.directorId;

        let results = await tmdbApi.discoverAdvanced('movie', params, apiKey);

        if (awardMovieIds) {
          results = results.filter((item: any) => awardMovieIds.includes(item.id));
        }

        setFilteredResults(results);
        setFiltersActive(true);
      }
    } catch (err) {
      console.error('Error discovering movies:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleClearFilters = () => {
    setFiltersActive(false);
    setFilteredResults([]);
  };

  const handleAddWatchlist = useCallback(async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!apiKey || loadingId) return;
    setLoadingId(item.id);
    try {
      const details = await tmdbApi.getDetails(item.id, 'movie', apiKey);
      addToWatchlist(details);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    } finally {
      setLoadingId(null);
    }
  }, [apiKey, addToWatchlist, loadingId]);

  return (
    <div className="py-8 pb-20">
      <div className="px-6 lg:px-10 mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-3xl md:text-4xl font-black text-white mb-2"
        >
          🎬 Movies
        </motion.h1>
        <p className="text-muted-light mb-6">Explore the world of cinema</p>
        
        <MagicSearch />
        
        <div className="mt-6">
          <FilterPanel 
            mediaType="movie" 
            onApplyFilters={handleApplyFilters} 
            onClearFilters={handleClearFilters} 
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loadingFilters ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="text-primary animate-spin mb-4" size={40} />
            <p className="text-sm text-muted-light">Filtering the cinematic universe...</p>
          </motion.div>
        ) : filtersActive ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 lg:px-10"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              🔍 Filter Results
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                {filteredResults.length} matches
              </span>
            </h2>

            {filteredResults.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
                <Film className="mx-auto text-muted mb-3" size={32} />
                <p className="text-sm text-muted-light">No movies found matching these criteria.</p>
                <p className="text-xs text-muted mt-1">Try tweaking your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {filteredResults.map((item, i) => {
                  const itemTitle = item.title || item.name;
                  const year = (item.release_date || item.first_air_date)?.substring(0, 4);
                  const rating = item.vote_average;
                  const alreadyAdded = isInList(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="card-poster w-full cursor-pointer group"
                      onClick={() => navigate(`/details/movie/${item.id}`)}
                    >
                      <div className="relative aspect-[2/3] bg-surface-light rounded-xl overflow-hidden">
                        {item.poster_path ? (
                          <img
                            src={IMG.poster(item.poster_path, 'w342')!}
                            alt={itemTitle}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted text-xs p-4 text-center">
                            {itemTitle}
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                          <button
                            onClick={(e) => handleAddWatchlist(e, item)}
                            disabled={alreadyAdded}
                            className={`flex items-center justify-center w-full gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                              alreadyAdded
                                ? 'bg-success/20 text-success'
                                : loadingId === item.id
                                ? 'bg-primary/20 text-primary'
                                : 'bg-primary text-white hover:bg-primary-dark'
                            }`}
                          >
                            {alreadyAdded ? (
                              <><Check size={14} /> In List</>
                            ) : loadingId === item.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <><Plus size={14} /> Watchlist</>
                            )}
                          </button>
                        </div>

                        {/* Rating badge */}
                        {rating > 0 && (
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[11px] font-semibold text-gold backdrop-blur-sm">
                            <Star size={10} className="fill-gold" />
                            {rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 px-1">
                        <h3 className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                          {itemTitle}
                        </h3>
                        <p className="text-xs text-muted-light">{year}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="rows"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ContentRow title="🔥 Trending This Week" items={trending} mediaType="movie" />
            <ContentRow title="🎥 Now in Theaters" items={nowPlaying} mediaType="movie" />
            <ContentRow title="📅 Coming Soon" items={upcoming} mediaType="movie" />
            <ContentRow title="⭐ Top Rated" items={topRated} mediaType="movie" />
            <ContentRow title="🍿 Popular" items={popular} mediaType="movie" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

