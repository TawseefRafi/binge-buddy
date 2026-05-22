import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: number;
}

export function StarRating({ rating, onRate = () => {}, interactive = false, size = 20 }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = displayRating >= star;
        const isHalf = displayRating >= star - 0.5 && displayRating < star;

        return (
          <motion.button
            key={star}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            onClick={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalfClick = e.clientX - rect.left < rect.width / 2;
              onRate(isHalfClick ? star - 0.5 : star);
            }}
            onMouseMove={(e) => {
              if (!interactive) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalfHover = e.clientX - rect.left < rect.width / 2;
              setHoverRating(isHalfHover ? star - 0.5 : star);
            }}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
            disabled={!interactive}
          >
            <div className="relative">
              <Star
                size={size}
                className={`${isFilled ? 'fill-gold text-gold' : 'text-gray-600'} transition-colors`}
              />
              {isHalf && (
                <div className="absolute top-0 left-0 overflow-hidden w-[50%] h-full">
                  <Star size={size} className="fill-gold text-gold" />
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
