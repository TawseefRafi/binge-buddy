import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogIn, UserPlus, Key, Mail, User, AlertCircle, Film } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/micah/svg?seed=Cinephile&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/micah/svg?seed=BingeWatcher&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/micah/svg?seed=Popcorn&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/micah/svg?seed=ActionHero&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/micah/svg?seed=Director&backgroundColor=ffdfbf',
];

export function Auth() {
  const { setUser, fetchUserData, syncLocalToCloud, movies, userLists } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Set up the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Register user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim() || `Cinephile_${Math.floor(Math.random() * 9000 + 1000)}`,
              avatar_url: selectedAvatar,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setSuccessMsg('Awesome! Your account has been created. However, you MUST verify your email before you can log in. Please check your inbox (and spam folder) for a verification link from Supabase.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        // Log in user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          setUser(data.user);
          
          // Before loading fresh DB, check if local storage has unsynced data
          const hasLocalData = movies.length > 0 || userLists.length > 0;
          if (hasLocalData) {
            // Silently merge local watchlist & diary onto their account
            await syncLocalToCloud();
          } else {
            // Load their database watchlist & diary
            await fetchUserData();
          }
        }
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || (err.message && typeof err.message === 'string' && err.message.toLowerCase().includes('failed to fetch'))) {
        setError('Connection failed (Failed to fetch). Please check if VITE_SUPABASE_URL in your .env file is correct, active, and matches your Supabase project URL.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/95 relative overflow-hidden px-4">
      {/* Cinematic background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl -z-10 animate-pulse duration-[6000ms]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl relative border border-white/10"
      >
        {/* Cinematic top gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-400 to-primary"></div>

        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 text-primary glow-border">
          <Film size={28} />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-center text-white">
          {isSignUp ? 'Create your Cine-Profile' : 'Welcome back to Binge Buddy'}
        </h2>
        <p className="mb-8 text-sm text-center text-muted-light">
          {isSignUp
            ? 'Join the community, isolate your watchlist, and analyze your tastes.'
            : 'Log in to sync your watchlists and join the community discussions.'}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="shrink-0 mt-0.5" size={14} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-5 rounded-2xl bg-primary/20 border border-primary/50 text-white text-sm flex flex-col items-center text-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center glow-primary">
              <Mail size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Verify Your Email</h3>
              <p className="text-muted-light leading-relaxed">{successMsg}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-muted-light mb-1.5 uppercase tracking-wider">Cine-Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. CinemaBuff"
                  className="w-full py-2.5 pl-10 pr-4 text-white text-sm bg-black/30 border rounded-xl border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
                />
              </div>
            </div>
          )}

          <div>
                <label className="block text-xs font-semibold text-muted-light mb-2.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Email Address</span>
                  {isSignUp && <span className="text-[10px] text-primary normal-case font-normal">(Needs verification)</span>}
                </label>
                <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail size={16} className="text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full py-2.5 pl-10 pr-4 text-white text-sm bg-black/30 border rounded-xl border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-light mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Key size={16} className="text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 pl-10 pr-4 text-white text-sm bg-black/30 border rounded-xl border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-muted-light mb-2.5 uppercase tracking-wider">Select Cine-Avatar</label>
              <div className="flex gap-3 justify-center py-1">
                {AVATAR_OPTIONS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${selectedAvatar === avatar ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-white/10 opacity-60'}`}
                  >
                    <img src={avatar} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-6 text-sm font-bold text-white rounded-xl bg-primary hover:bg-primary-hover focus:outline-none shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} /> Register Cine-Profile
              </>
            ) : (
              <>
                <LogIn size={18} /> Log In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-light">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Log In here
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Sign Up now
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
