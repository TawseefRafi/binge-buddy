import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Info, Check, Loader2 } from 'lucide-react';
import { IMG, tmdbApi } from '../lib/tmdb';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export function HeroBanner() {
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const { apiKey, addToWatchlist, isInList } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!apiKey) return;
    tmdbApi.getTrending('all', 'day', apiKey).then((data) => {
      setItems(data.filter((i: any) => i.backdrop_path).slice(0, 8));
    });
  }, [apiKey]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items.length]);

  const handleAdd = useCallback(async () => {
    if (!apiKey || loadingAdd) return;
    const item = items[currentIndex];
    setLoadingAdd(true);
    try {
      const type = item.media_type || 'movie';
      const details = await tmdbApi.getDetails(item.id, type, apiKey);
      addToWatchlist(details);
    } catch (err) { console.error(err); }
    finally { setLoadingAdd(false); }
  }, [apiKey, items, currentIndex, addToWatchlist, loadingAdd]);

  if (items.length === 0) {
    return (
      <div className="h-[65vh] w-full skeleton rounded-none" />
    );
  }

  const item = items[currentIndex];
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date)?.substring(0, 4);
  const alreadyAdded = isInList(item.id);

  return (
    <div className="relative w-full h-[65vh] min-h-[500px] overflow-hidden">
      {/* Backdrop Image */}
      {items.map((it, idx) => (
        <motion.div
          key={it.id}
          initial={false}
          animate={{ opacity: idx === currentIndex ? 1 : 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img
            src={IMG.backdrop(it.backdrop_path)!}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-20 px-6 lg:px-10">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              {item.media_type === 'movie' ? '🎬 Movie' : '📺 TV Series'}
            </span>
            {year && <span className="text-sm text-muted-light">{year}</span>}
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 text-sm text-gold">
                <Star size={14} className="fill-gold" /> {item.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{title}</h1>
          <p className="text-sm text-gray-300 line-clamp-3 mb-6 max-w-md leading-relaxed">{item.overview}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/details/${item.media_type || 'movie'}/${item.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg"
            >
              <Info size={18} /> Details
            </button>
            <button
              onClick={handleAdd}
              disabled={alreadyAdded}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
                alreadyAdded
                  ? 'bg-success/15 text-success border border-success/30'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md'
              }`}
            >
              {alreadyAdded ? <><Check size={18} /> In List</> : loadingAdd ? <><Loader2 size={18} className="animate-spin" /> Adding...</> : <><Plus size={18} /> Add to Watchlist</>}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-6 right-6 lg:right-10 flex gap-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-primary' : 'w-3 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
