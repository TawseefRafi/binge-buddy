import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Plus, X } from 'lucide-react';
import { IMG } from '../lib/tmdb';

export function FavoritesSlot() {
  const { topFavorites, setTopFavorite, movies } = useStore();
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const watchedMovies = movies.filter(m => m.status === 'watched');

  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-white mb-6">🏆 Top 4 Hall of Fame</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((index) => {
          const movieId = topFavorites[index];
          const movie = movies.find(m => m.id === movieId);

          return (
            <div key={index} className="relative group">
              {movie ? (
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 glass glow-border">
                  {movie.poster_path && (
                    <img src={IMG.poster(movie.poster_path)!} alt={movie.title} className="object-cover w-full h-full" />
                  )}
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-black/70 group-hover:opacity-100 flex items-center justify-center">
                    <button onClick={() => setTopFavorite(index, null)} className="p-3 text-white transition-colors bg-danger rounded-full hover:bg-danger/80 shadow-xl">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectingIndex(index)}
                  className="flex flex-col items-center justify-center w-full aspect-[2/3] rounded-xl glass-light glass-panel-hover border border-dashed border-white/15 text-muted hover:text-primary transition-all"
                >
                  <Plus size={28} className="mb-2" />
                  <span className="text-xs font-medium">Add Favorite</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectingIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectingIndex(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl p-6 glass rounded-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Select a Favorite</h2>
                <button onClick={() => setSelectingIndex(null)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>
              <div className="overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
                {watchedMovies.length === 0 ? (
                  <p className="col-span-full text-center text-muted py-10">No watched movies to select from.</p>
                ) : (
                  watchedMovies.map(m => (
                    <button key={m.id} onClick={() => { setTopFavorite(selectingIndex, m.id); setSelectingIndex(null); }} className="relative rounded-xl overflow-hidden border border-transparent hover:border-primary transition-all aspect-[2/3]">
                      {m.poster_path ? (
                        <img src={IMG.poster(m.poster_path, 'w342')!} alt={m.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-surface-light flex items-center justify-center text-xs p-2 text-center">{m.title}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
