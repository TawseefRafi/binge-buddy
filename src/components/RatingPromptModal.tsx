import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { StarRating } from './StarRating';
import { useStore } from '../store/useStore';
import type { Movie } from '../lib/types';
import { IMG } from '../lib/tmdb';

interface RatingPromptModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export function RatingPromptModal({ movie, onClose }: RatingPromptModalProps) {
  const { moveToWatched, addToWatchlist } = useStore();
  const [rating, setRating] = useState(0);

  if (!movie) return null;

  const handleSave = () => {
    if (movie.status === 'none') addToWatchlist(movie);
    moveToWatched(movie.id, rating);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm p-6 overflow-hidden glass rounded-2xl shadow-2xl relative"
        >
          {movie.backdrop_path && (
            <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${IMG.backdrop(movie.backdrop_path, 'w780')})` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-primary" />
            </div>
            <h3 className="mb-1 text-xl font-bold text-white">Rate {movie.title}</h3>
            <p className="mb-8 text-sm text-muted-light">How was the experience?</p>

            <div className="mb-8 scale-150 transform origin-center">
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>

            <button
              onClick={handleSave}
              disabled={rating === 0}
              className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={20} /> Save to Watched
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
