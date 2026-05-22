import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../store/useStore';
import { FavoritesSlot } from '../components/FavoritesSlot';
import { CineWrapped } from '../components/CineWrapped';
import { tmdbApi } from '../lib/tmdb';
import { Clock, Film, Star, TrendingUp, Sparkles } from 'lucide-react';
import { ContentRow } from '../components/ContentRow';

const CHART_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#06b6d4', '#22d3ee', '#34d399', '#fbbf24', '#f97316'];

export function Analytics() {
  const { movies, apiKey } = useStore();
  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched'), [movies]);

  // Recommendations
  const [recs, setRecs] = useState<any[]>([]);

  const stats = useMemo(() => {
    let totalRuntime = 0;
    const genresCount: Record<string, number> = {};
    const ratingsCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const countriesCount: Record<string, number> = {};
    const directorsCount: Record<string, number> = {};
    const languagesCount: Record<string, number> = {};

    watchedMovies.forEach(m => {
      totalRuntime += m.runtime || 0;
      m.genres.forEach(g => { genresCount[g] = (genresCount[g] || 0) + 1; });
      if (m.user_rating) {
        const rounded = Math.round(m.user_rating);
        if (rounded >= 1 && rounded <= 5) ratingsCount[rounded]++;
      }
      m.origin_country.forEach(c => { countriesCount[c] = (countriesCount[c] || 0) + 1; });
      m.directors.forEach(d => { directorsCount[d] = (directorsCount[d] || 0) + 1; });
      m.spoken_languages.forEach(l => { languagesCount[l] = (languagesCount[l] || 0) + 1; });
    });

    const days = Math.floor(totalRuntime / (24 * 60));
    const hours = Math.floor((totalRuntime % (24 * 60)) / 60);
    const minutes = totalRuntime % 60;

    const topGenre = Object.entries(genresCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const topDirector = Object.entries(directorsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Archetype
    let archetype = 'The Casual Viewer';
    const totalWatched = watchedMovies.length;
    if (totalWatched >= 50) archetype = 'The Cinephile';
    if (topGenre === 'Science Fiction') archetype = 'Sci-Fi Voyager';
    else if (topGenre === 'Horror') archetype = 'Thrill Seeker';
    else if (topGenre === 'Romance') archetype = 'Hopeless Romantic';
    else if (topGenre === 'Action') archetype = 'Adrenaline Junkie';
    else if (topGenre === 'Documentary') archetype = 'Truth Seeker';
    else if (topGenre === 'Animation') archetype = 'Animation Aficionado';
    else if (topGenre === 'Drama') archetype = 'Drama Connoisseur';
    else if (topGenre === 'Comedy') archetype = 'Comedy King';
    else if (topGenre === 'Thriller') archetype = 'Edge-of-Seat Expert';

    const genresData = Object.entries(genresCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    const ratingsData = Object.entries(ratingsCount).map(([rating, count]) => ({ rating: `${rating}★`, count }));
    const countriesData = Object.entries(countriesCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    const languagesData = Object.entries(languagesCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

    return { totalRuntime, days, hours, minutes, topGenre, topDirector, archetype, totalWatched, genresData, ratingsData, countriesData, languagesData };
  }, [watchedMovies]);

  // Fetch recommendations based on top genre
  useEffect(() => {
    if (!apiKey || watchedMovies.length === 0) return;
    const genreMap: Record<string, string> = {
      'Action': '28', 'Adventure': '12', 'Animation': '16', 'Comedy': '35', 'Crime': '80',
      'Documentary': '99', 'Drama': '18', 'Family': '10751', 'Fantasy': '14', 'History': '36',
      'Horror': '27', 'Music': '10402', 'Mystery': '9648', 'Romance': '10749', 'Science Fiction': '878',
      'Thriller': '53', 'War': '10752', 'Western': '37'
    };
    const genreId = genreMap[stats.topGenre] || '28';
    tmdbApi.getRecommendations(genreId, apiKey).then(data => {
      const existing = new Set(movies.map(m => m.id));
      setRecs(data.filter((m: any) => !existing.has(m.id)).slice(0, 8));
    });
  }, [apiKey, stats.topGenre, watchedMovies.length]);



  const statCards = [
    { icon: Film, label: 'Total Watched', value: stats.totalWatched.toString(), color: 'text-primary', bg: 'bg-primary/15' },
    { icon: Clock, label: 'Time Spent', value: `${stats.days > 0 ? stats.days + 'd ' : ''}${stats.hours}h ${stats.minutes}m`, color: 'text-accent', bg: 'bg-accent/15' },
    { icon: TrendingUp, label: 'Top Genre', value: stats.topGenre, color: 'text-success', bg: 'bg-success/15' },
    { icon: Star, label: 'Top Director', value: stats.topDirector, color: 'text-gold', bg: 'bg-gold/15' },
  ];

  return (
    <div className="py-8 pb-20 px-6 lg:px-10">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-2">
        📊 Analytics Hub
      </motion.h1>
      <p className="text-muted-light mb-10">Deep insights into your cinematic journey</p>

      {watchedMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center glass-light rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mb-4">
            <TrendingUp size={32} className="text-muted" />
          </div>
          <p className="text-xl font-bold text-white mb-2">No Data Yet</p>
          <p className="text-sm text-muted-light max-w-sm">Mark movies as watched and rate them to see your personalized analytics, archetype, and AI-powered recommendations.</p>
        </div>
      ) : (
        <>
          {/* Archetype Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-10 p-6 glass rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg glow-primary">
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-light uppercase tracking-widest font-medium mb-1">Your Cinematic Archetype</p>
                <h2 className="text-2xl md:text-3xl font-black text-gradient">{stats.archetype}</h2>
              </div>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {statCards.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="p-5 glass-light rounded-2xl">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">{card.label}</p>
                <p className="text-xl font-bold text-white truncate">{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Genre Chart */}
            <div className="p-6 glass-light rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-6">Top Watched Genres</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.genresData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={100} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {stats.genresData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="p-6 glass-light rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-6">Rating Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ratingsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="rating" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis hide />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Countries & Languages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="p-6 glass-light rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Top Watch Countries</h3>
              <div className="space-y-3">
                {stats.countriesData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white w-10">{c.name}</span>
                    <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(c.count / stats.countriesData[0].count) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className="h-full rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-sm text-muted-light w-8 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 glass-light rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Languages Watched</h3>
              <div className="space-y-3">
                {stats.languagesData.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white w-20 truncate">{l.name}</span>
                    <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(l.count / stats.languagesData[0].count) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className="h-full rounded-full" style={{ backgroundColor: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-sm text-muted-light w-8 text-right">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <FavoritesSlot />
          <CineWrapped />

          {/* AI Recommendations */}
          {recs.length > 0 && (
            <ContentRow title="🤖 AI Recommended For You" items={recs} mediaType="movie" />
          )}
        </>
      )}
    </div>
  );
}
