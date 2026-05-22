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
import type { Movie } from '../lib/types';

export function AnimePage() {
  const { apiKey, addToWatchlist, isInList } = useStore();
  const navigate = useNavigate();

  const [popularSeries, setPopularSeries] = useState<any[]>([]);
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);

  // Advanced Filters State
  const [filtersActive, setFiltersActive] = useState(false);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    Promise.allSettled([
      // Popular TV Anime (Genre 16 = Animation, Country JP)
      tmdbApi.discoverAdvanced('tv', { 
        with_genres: '16', 
        with_origin_country: 'JP', 
        sort_by: 'popularity.desc' 
      }, apiKey).then(setPopularSeries),

      // Popular Movie Anime (Genre 16 = Animation, Country JP)
      tmdbApi.discoverAdvanced('movie', { 
        with_genres: '16', 
        with_origin_country: 'JP', 
        sort_by: 'popularity.desc' 
      }, apiKey).then(setPopularMovies),

      // Top Rated TV Anime
      tmdbApi.discoverAdvanced('tv', { 
        with_genres: '16', 
        with_origin_country: 'JP', 
        sort_by: 'vote_average.desc',
        'vote_count.gte': '150'
      }, apiKey).then(setTopRated),
    ]);
  }, [apiKey]);

  const handleApplyFilters = async (filters: {
    genre?: string;
    castId?: string;
    directorId?: string;
    prize?: string;
  }) => {
    if (!apiKey) return;
    setLoadingFilters(true);
    try {
      const awardMovieIds = filters.prize ? getMovieIdsByAward(filters.prize as any) : null;
      const isOnlyPrizeActive = !!filters.prize && !filters.genre && !filters.castId && !filters.directorId;

      if (isOnlyPrizeActive && awardMovieIds) {
        const detailsPromises = awardMovieIds.map(async (movieId) => {
          try {
            return await tmdbApi.getDetails(movieId, 'movie', apiKey);
          } catch (e) {
            try {
              return await tmdbApi.getDetails(movieId, 'tv', apiKey);
            } catch (err2) {
              console.error(`Failed to fetch details for anime movie/series ${movieId}:`, err2);
              return null;
            }
          }
        });
        const detailsResults = await Promise.all(detailsPromises);
        const validResults = detailsResults.filter((item): item is Movie => {
          if (!item) return false;
          const isAnimation = item.genres.includes('Animation') || item.genres.includes('Anime');
          const isJapan = item.origin_country.includes('JP') || item.origin_country.includes('Japan');
          return isAnimation && isJapan;
        });
        setFilteredResults(validResults);
        setFiltersActive(true);
      } else {
        const params: Record<string, string> = {
          with_origin_country: 'JP',
          sort_by: 'popularity.desc',
        };

        if (filters.genre) {
          params.with_genres = `16,${filters.genre}`;
        } else {
          params.with_genres = '16';
        }

        if (filters.castId) params.with_cast = filters.castId;
        if (filters.directorId) params.with_crew = filters.directorId;

        let results = await tmdbApi.discoverAdvanced('tv', params, apiKey);

        if (awardMovieIds) {
          results = results.filter((item: any) => awardMovieIds.includes(item.id));
        }

        setFilteredResults(results);
        setFiltersActive(true);
      }
    } catch (err) {
      console.error('Error discovering Anime:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleClearFilters = () => {
    setFiltersActive(false);
    setFilteredResults([]);
  };

  const handleAddWatchlist = useCallback(async (e: React.MouseEvent, item: any, mediaType: 'tv' | 'movie') => {
    e.stopPropagation();
    if (!apiKey || loadingId) return;
    setLoadingId(item.id);
    try {
      const details = await tmdbApi.getDetails(item.id, mediaType, apiKey);
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
          🌸 Anime
        </motion.h1>
        <p className="text-muted-light mb-6">Discover the ultimate collection of Japanese animation</p>
        
        <MagicSearch />
        
        <div className="mt-6">
          <FilterPanel 
            mediaType="tv" 
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
            <p className="text-sm text-muted-light">Filtering anime databases...</p>
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
                <p className="text-sm text-muted-light">No Anime found matching these criteria.</p>
                <p className="text-xs text-muted mt-1">Try tweaking your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {filteredResults.map((item, i) => {
                  const itemTitle = item.title || item.name;
                  const year = (item.release_date || item.first_air_date)?.substring(0, 4);
                  const rating = item.vote_average;
                  const alreadyAdded = isInList(item.id);

                  const actualMediaType = item.media_type || (item.title ? 'movie' : 'tv');

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="card-poster w-full cursor-pointer group"
                      onClick={() => navigate(`/details/${actualMediaType}/${item.id}`)}
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
                            onClick={(e) => handleAddWatchlist(e, item, actualMediaType as 'tv' | 'movie')}
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
            <ContentRow title="🔥 Popular Anime Series" items={popularSeries} mediaType="tv" />
            <ContentRow title="🎬 Anime Movies" items={popularMovies} mediaType="movie" />
            <ContentRow title="⭐ Top Rated Anime" items={topRated} mediaType="tv" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
