import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Film, Tv, BookmarkCheck, BarChart3, Users, User, Sparkles, LogOut, Compass, LogIn } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SupabaseSetupModal } from './SupabaseSetupModal';
import { EditProfileModal } from './EditProfileModal';
import { AIChatbot } from './AIChatbot';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/movies', icon: Film, label: 'Movies' },
  { to: '/series', icon: Tv, label: 'Series' },
  { to: '/anime', icon: Compass, label: 'Anime' },
  { to: '/my-list', icon: BookmarkCheck, label: 'My List' },
  { to: '/stats', icon: BarChart3, label: 'Analytics' },
  { to: '/ai-advisor', icon: Sparkles, label: 'AI Advisor' },
  { to: '/community', icon: Users, label: 'Community' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { clearApiKey, user, profile, signOut } = useStore();
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 w-[72px] lg:w-[240px] glass border-r border-border z-40 flex flex-col transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-6 lg:px-6">
          <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Binge Buddy Logo" className="w-full h-full object-contain drop-shadow-lg scale-125" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white tracking-tight">Binge Buddy</h1>
            <p className="text-[10px] text-muted-light uppercase tracking-widest">Cinema Tracker</p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 flex flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-muted-light hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <item.icon size={20} className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform flex-shrink-0`} />
                <span className="hidden lg:block text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom User Card & Actions */}
        <div className="px-3 pb-6 space-y-3">
          {user && profile && (
            <div className="hidden lg:flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-xl">
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                alt={profile.username}
                className="w-9 h-9 rounded-full object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{profile.username}</p>
                <p className="text-[10px] text-muted-light truncate">Cinephile</p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {user && (
              <>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-light hover:bg-primary/10 hover:text-primary transition-all border border-transparent cursor-pointer"
                >
                  <User size={20} />
                  <span className="hidden lg:block text-sm font-medium">Edit Profile</span>
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-light hover:bg-danger/10 hover:text-danger transition-all border border-transparent cursor-pointer"
                >
                  <LogOut size={20} />
                  <span className="hidden lg:block text-sm font-medium">Sign Out</span>
                </button>
              </>
            )}

            {!user && (
              <>
                <button
                  onClick={() => setIsSetupOpen(true)}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all border border-transparent cursor-pointer font-semibold"
                >
                  <LogIn size={20} />
                  <span className="hidden lg:block text-sm font-medium">Sign In</span>
                </button>
                <button
                  onClick={clearApiKey}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-light hover:bg-danger/10 hover:text-danger transition-all border border-transparent cursor-pointer"
                >
                  <LogOut size={20} />
                  <span className="hidden lg:block text-sm font-medium">Reset API Key</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-[72px] lg:ml-[240px] relative overflow-hidden">
        {/* Ambient light effects */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/8 blur-[150px] rounded-full pointer-events-none -translate-y-1/3 translate-x-1/4" />
        <div className="fixed bottom-0 left-1/3 w-[400px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none translate-y-1/3" />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Supabase Setup / Connect Instructions Modal */}
      <SupabaseSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

      {/* Global Context AI Chatbot */}
      <AIChatbot />
    </div>
  );
}
