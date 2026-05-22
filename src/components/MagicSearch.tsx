import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Star, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tmdbApi, IMG } from '../lib/tmdb';
import { useStore } from '../store/useStore';

export function MagicSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { apiKey, addToWatchlist, isInList } = useStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || !apiKey) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await tmdbApi.search(query, apiKey);
        setResults(data);
        setIsOpen(true);
      } catch {
        console.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, apiKey]);

  const handleAdd = useCallback(async (item: any) => {
    if (!apiKey || loadingId) return;
    setLoadingId(item.id);
    try {
      const details = await tmdbApi.getDetails(item.id, item.media_type, apiKey);
      addToWatchlist(details);
    } catch (err) {
      console.error('Failed to get details:', err);
    } finally {
      setLoadingId(null);
    }
  }, [apiKey, addToWatchlist, loadingId]);

  return (
    <div className="relative z-40 w-full max-w-2xl" ref={searchRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          {isSearching ? (
            <Loader2 size={18} className="text-primary animate-spin" />
          ) : (
            <Search size={18} className="text-muted group-focus-within:text-primary transition-colors" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Search movies & TV shows..."
          className="w-full py-3 pl-11 pr-10 text-sm text-white bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all placeholder-muted"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }} className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 overflow-hidden rounded-xl glass shadow-2xl"
          >
            <ul className="max-h-[70vh] overflow-y-auto py-2">
              {results.map((item) => {
                const title = item.title || item.name;
                const year = (item.release_date || item.first_air_date)?.substring(0, 4);
                const alreadyAdded = isInList(item.id);
                return (
                  <li key={item.id}>
                    <div
                      onClick={() => {
                        navigate(`/details/${item.media_type}/${item.id}`);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors group/item"
                    >
                      {item.poster_path ? (
                        <img src={IMG.poster(item.poster_path, 'w92')!} alt={title} className="w-10 h-14 object-cover rounded-md shadow-md flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-14 rounded-md bg-surface-light flex items-center justify-center flex-shrink-0">
                          <Search size={14} className="text-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">{title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-light">
                          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium uppercase">
                            {item.media_type === 'movie' ? 'Movie' : 'TV'}
                          </span>
                          {year && <span>{year}</span>}
                          {item.vote_average > 0 && (
                            <span className="flex items-center gap-0.5"><Star size={10} className="text-gold fill-gold" /> {item.vote_average.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(item);
                        }}
                        disabled={alreadyAdded || loadingId === item.id}
                        className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                          alreadyAdded ? 'bg-success/15 text-success cursor-default' :
                          loadingId === item.id ? 'bg-primary/10 text-primary' :
                          'bg-primary/10 text-primary hover:bg-primary/25'
                        }`}
                      >
                        {alreadyAdded ? <Check size={16} /> : loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
