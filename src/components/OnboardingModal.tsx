import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ExternalLink, Clapperboard } from 'lucide-react';
import { useStore } from '../store/useStore';

export function OnboardingModal() {
  const { apiKey, setApiKey } = useStore();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setError('Please enter a valid TMDB API key.');
      return;
    }
    setApiKey(inputKey.trim());
  };

  return (
    <AnimatePresence>
      {!apiKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Cinematic top gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-400 to-primary"></div>
            
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 text-primary glow-border">
              <Clapperboard size={32} />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-center text-white">Welcome to Binge Buddy</h2>
            <p className="mb-8 text-sm text-center text-gray-400">
              Your personal cinephile analytics hub. To fetch rich movie and series data, we need a TMDB API key.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Key size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your TMDB API Key v3 auth"
                    className="w-full py-3 pl-10 pr-4 text-white bg-black/30 border rounded-xl border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
                  />
                </div>
                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3 font-semibold text-white transition-all bg-primary rounded-xl hover:bg-primary/80 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                Unlock Dashboard
              </button>
            </form>

            <div className="mt-6 text-xs text-center text-gray-500">
              Don't have one?{' '}
              <a
                href="https://developer.themoviedb.org/docs/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline"
              >
                Get a free API key <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
