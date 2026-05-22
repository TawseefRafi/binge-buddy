import { useState, useEffect } from 'react';
import { tmdbApi } from '../lib/tmdb';
import { useStore } from '../store/useStore';
import { HeroBanner } from '../components/HeroBanner';
import { ContentRow } from '../components/ContentRow';
import { MagicSearch } from '../components/MagicSearch';
import { Film, Clock, Sparkles } from 'lucide-react';

export function Home() {
  const { apiKey, movies } = useStore();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingTV, setTrendingTV] = useState<any[]>([]);
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<any[]>([]);
  const [nowPlaying, setNowPlaying] = useState<any[]>([]);
  const [popularTV, setPopularTV] = useState<any[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<any[]>([]);
  const [onTheAir, setOnTheAir] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    if (!apiKey) return;

    Promise.allSettled([
      tmdbApi.getTrending('movie', 'week', apiKey).then(setTrendingMovies),
      tmdbApi.getTrending('tv', 'week', apiKey).then(setTrendingTV),
      tmdbApi.getPopular('movie', apiKey).then(setPopularMovies),
      tmdbApi.getTopRated('movie', apiKey).then(setTopRatedMovies),
      tmdbApi.getNowPlaying(apiKey).then(setNowPlaying),
      tmdbApi.getPopular('tv', apiKey).then(setPopularTV),
      tmdbApi.getTopRated('tv', apiKey).then(setTopRatedTV),
      tmdbApi.getOnTheAir(apiKey).then(setOnTheAir),
      tmdbApi.getUpcoming(apiKey).then(setUpcoming),
    ]);
  }, [apiKey]);

  const watchlistCount = movies.filter(m => m.status === 'watchlist').length;
  const watchedCount = movies.filter(m => m.status === 'watched').length;
  const totalRuntime = movies.filter(m => m.status === 'watched').reduce((sum, m) => sum + (m.runtime || 0), 0);
  const hours = Math.floor(totalRuntime / 60);

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Quick Stats + Search Bar */}
      <div className="px-6 lg:px-10 -mt-10 relative z-20 mb-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <MagicSearch />
          
          {/* Mini stat pills */}
          <div className="flex gap-3 flex-wrap">
            <div className="glass-light px-4 py-2.5 rounded-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Clock size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Watchlist</p>
                <p className="text-sm font-bold text-white">{watchlistCount}</p>
              </div>
            </div>
            <div className="glass-light px-4 py-2.5 rounded-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                <Film size={16} className="text-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Watched</p>
                <p className="text-sm font-bold text-white">{watchedCount}</p>
              </div>
            </div>
            <div className="glass-light px-4 py-2.5 rounded-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                <Sparkles size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Hours</p>
                <p className="text-sm font-bold text-white">{hours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <ContentRow title="🔥 Trending Movies This Week" items={trendingMovies} mediaType="movie" />
      <ContentRow title="📺 Trending TV Shows" items={trendingTV} mediaType="tv" />
      <ContentRow title="🎬 Now in Theaters" items={nowPlaying} mediaType="movie" />
      <ContentRow title="📡 Currently On Air" items={onTheAir} mediaType="tv" />
      <ContentRow title="⭐ Top Rated Movies" items={topRatedMovies} mediaType="movie" />
      <ContentRow title="🏆 Top Rated TV Shows" items={topRatedTV} mediaType="tv" />
      <ContentRow title="🍿 Popular Movies" items={popularMovies} mediaType="movie" />
      <ContentRow title="🎭 Popular TV Shows" items={popularTV} mediaType="tv" />
      <ContentRow title="📅 Upcoming Movies" items={upcoming} mediaType="movie" />
    </div>
  );
}
