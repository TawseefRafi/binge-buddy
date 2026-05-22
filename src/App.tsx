import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { OnboardingModal } from './components/OnboardingModal';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MoviesPage } from './pages/Movies';
import { SeriesPage } from './pages/Series';
import { AnimePage } from './pages/Anime';
import { MyList } from './pages/MyList';
import { Analytics } from './pages/Analytics';
import { Details } from './pages/Details';
import { AIAdvisor } from './pages/AIAdvisor';
import { CommunityHub } from './pages/Community';
import { Auth } from './pages/Auth';
import { useStore } from './store/useStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';

function App() {
  const { apiKey, user, setUser, setProfile, fetchUserData, syncLocalToCloud } = useStore();
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Safety net: force loading to end after 5 seconds no matter what
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    // Check active session on mount
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      if (session) {
        setUser(session.user);
        fetchUserData();
      }
      clearTimeout(timeout);
      setAuthLoading(false);
    }).catch((err: any) => {
      console.error('Supabase getSession error:', err);
      clearTimeout(timeout);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
          const state = useStore.getState();
          const hasLocalData = state.movies.length > 0 || state.userLists.length > 0;
          if (hasLocalData) {
            await syncLocalToCloud();
          } else {
            await fetchUserData();
          }
        } else {
          await fetchUserData();
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/95">
        <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    );
  }

  // Force login/registration if Supabase is configured
  if (isSupabaseConfigured && !user) {
    return <Auth />;
  }

  return (
    <Router>
      <OnboardingModal />
      {apiKey && (
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/my-list" element={<MyList />} />
            <Route path="/stats" element={<Analytics />} />
            <Route path="/community" element={<CommunityHub />} />
            <Route path="/ai-advisor" element={<AIAdvisor />} />
            <Route path="/details/:mediaType/:id" element={<Details />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
