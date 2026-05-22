import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Check, Copy, ExternalLink } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseSetupModal({ isOpen, onClose }: SupabaseSetupModalProps) {
  const [copied, setCopied] = useState(false);

  const envTemplate = `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_TMDB_API_KEY=your_tmdb_api_key_here`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="w-full max-w-lg p-6 md:p-8 glass rounded-2xl shadow-2xl relative overflow-hidden border border-white/10"
          >
            {/* Cinematic top gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-400 to-primary"></div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-primary/20 text-primary rounded-xl glow-primary">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Supabase Offline Mode</h2>
                <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Multi-User Account Setup</p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed">
              <p>
                Binge Buddy is currently running in <strong>Guest Mode (Offline)</strong>. To enable cloud databases, real accounts, watchlists, diaries, and live community feeds, you need to connect your Supabase database instance.
              </p>

              <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-1">
                  🛠️ How to connect:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-gray-400">
                  <li>
                    Create a free project at{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink size={10} />
                    </a>
                  </li>
                  <li>
                    Run the setup script inside{' '}
                    <code className="text-white bg-white/10 px-1 rounded font-mono">
                      supabase_setup.sql
                    </code>{' '}
                    in your Supabase SQL Editor.
                  </li>
                  <li>
                    Create a file named <code className="text-primary font-mono">.env</code> in the project
                    root.
                  </li>
                  <li>Copy and paste your Project API credentials as shown below.</li>
                </ol>
              </div>

              {/* Code block */}
              <div className="relative">
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-muted hover:text-white transition-all cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre className="p-4 bg-black/55 border border-white/5 rounded-xl font-mono text-[10px] md:text-xs text-gray-300 overflow-x-auto select-all leading-normal pt-10">
                  {envTemplate}
                </pre>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                  Got it, Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
