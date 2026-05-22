import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Plus, Check, Loader2 } from 'lucide-react';
import { IMG } from '../lib/tmdb';
import { useState, useCallback } from 'react';
import { tmdbApi } from '../lib/tmdb';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

interface ContentRowProps {
  title: string;
  items: any[];
  mediaType?: 'movie' | 'tv';
}

export function ContentRow({ title, items, mediaType }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { apiKey, addToWatchlist, isInList } = useStore();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleAdd = useCallback(async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!apiKey || loadingId) return;
    setLoadingId(item.id);
    try {
      const type = mediaType || item.media_type || 'movie';
      const details = await tmdbApi.getDetails(item.id, type, apiKey);
      addToWatchlist(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  }, [apiKey, addToWatchlist, loadingId, mediaType]);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-6 lg:px-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full bg-surface-light hover:bg-white/10 text-muted-light hover:text-white transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full bg-surface-light hover:bg-white/10 text-muted-light hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 px-6 lg:px-10 carousel-scroll pb-4">
        {items.map((item, i) => {
          const itemTitle = item.title || item.name;
          const year = (item.release_date || item.first_air_date)?.substring(0, 4);
          const rating = item.vote_average;
          const alreadyAdded = isInList(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="card-poster w-[160px] md:w-[180px] cursor-pointer group"
              onClick={() => {
                const type = mediaType || item.media_type || 'movie';
                navigate(`/details/${type}/${item.id}`);
              }}
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
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs p-4 text-center">{itemTitle}</div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                  <button
                    onClick={(e) => handleAdd(e, item)}
                    disabled={alreadyAdded}
                    className={`flex items-center justify-center w-full gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      alreadyAdded
                        ? 'bg-success/20 text-success'
                        : loadingId === item.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    {alreadyAdded ? <><Check size={14} /> In List</> : loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Watchlist</>}
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
                <h3 className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{itemTitle}</h3>
                <p className="text-xs text-muted-light">{year}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
