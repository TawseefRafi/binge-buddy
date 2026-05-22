import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Movie } from '../lib/types';
import { supabase, dbAPI, isSupabaseConfigured } from '../lib/supabase';
import type { DBProfile } from '../lib/supabase';

export interface CustomList {
  id: string;
  name: string;
  description: string;
  movieIds: number[];
}

export interface WatchLog {
  id: string;
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv';
  date: string;
  rating: number;
  review?: string;
  rewatch: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  type: 'genre' | 'director' | 'language' | 'count';
  param: string;
  completed: boolean;
}

interface StoreState {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;

  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;

  // Authentication State
  user: any | null;
  profile: DBProfile | null;
  isLoading: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: DBProfile | null) => void;
  setIsLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  syncLocalToCloud: () => Promise<void>;
  updateUserProfile: (username: string, avatarUrl: string) => Promise<boolean>;

  movies: Movie[];
  addMovie: (movie: Movie) => Promise<void>;
  removeMovie: (id: number) => Promise<void>;
  addToWatchlist: (movie: Movie) => Promise<void>;
  moveToWatched: (id: number, rating: number) => Promise<void>;
  moveToWatchlist: (id: number) => Promise<void>;
  updateRating: (id: number, rating: number) => Promise<void>;
  updateReview: (id: number, review: string) => Promise<void>;
  isInList: (id: number) => boolean;
  getMovieStatus: (id: number) => 'watchlist' | 'watched' | 'none';

  topFavorites: number[];
  setTopFavorite: (index: number, id: number | null) => Promise<void>;

  // Custom Lists
  userLists: CustomList[];
  createUserList: (name: string, description: string) => Promise<void>;
  deleteUserList: (id: string) => Promise<void>;
  addMovieToList: (listId: string, movieId: number) => Promise<void>;
  removeMovieFromList: (listId: string, movieId: number) => Promise<void>;

  // Watch logs diary
  watchLogs: WatchLog[];
  addWatchLog: (movie: Movie, rating: number, review?: string, rewatch?: boolean, date?: string) => Promise<void>;
  removeWatchLog: (id: string) => Promise<void>;

  // AI Chat History
  aiChatHistory: ChatMessage[];
  addChatMessage: (sender: 'user' | 'ai', text: string) => void;
  clearChatHistory: () => void;

  // Community Challenges
  challenges: CommunityChallenge[];
  updateChallenges: () => void;
  addCustomChallenge: (title: string, description: string, targetCount: number, type: 'genre' | 'director' | 'language' | 'count', param: string) => void;
  deleteChallenge: (id: string) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DEFAULT_CHALLENGES: CommunityChallenge[] = [
  { id: '1', title: 'The Director Dive', description: 'Watch 3 movies directed by the same person', targetCount: 3, currentCount: 0, type: 'director', param: '', completed: false },
  { id: '2', title: 'Polyglot Cinephile', description: 'Watch 4 movies in a language other than English', targetCount: 4, currentCount: 0, type: 'language', param: 'English', completed: false },
  { id: '3', title: 'Sci-Fi Voyager', description: 'Watch 5 Science Fiction movies/shows', targetCount: 5, currentCount: 0, type: 'genre', param: 'Science Fiction', completed: false },
  { id: '4', title: 'Binge Marathoner', description: 'Mark 15 titles as Watched in total', targetCount: 15, currentCount: 0, type: 'count', param: '', completed: false },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      apiKey: (import.meta.env.VITE_TMDB_API_KEY as string) || null,
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),

      geminiApiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || null,
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      clearGeminiApiKey: () => set({ geminiApiKey: null }),

      // Authentication State
      user: null,
      profile: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setIsLoading: (isLoading) => set({ isLoading }),
      signOut: async () => {
        if (isSupabaseConfigured) {
          await supabase.auth.signOut();
        }
        set({
          user: null,
          profile: null,
          movies: [],
          userLists: [],
          watchLogs: [],
          topFavorites: [-1, -1, -1, -1],
          aiChatHistory: [
            {
              id: 'welcome',
              sender: 'ai',
              text: "Hey! I am your AI Cine-Advisor. I've analyzed your watched titles, reviews, and taste parameters. Ask me anything, request custom recommendations, or get a harsh critique of your movie choices!",
              timestamp: new Date().toISOString(),
            },
          ],
        });
        get().updateChallenges();
      },

      fetchUserData: async () => {
        const { user } = get();
        if (!user) return;
        set({ isLoading: true });
        try {
          const dbMovies = await dbAPI.fetchUserMovies(user.id);
          const dbLists = await dbAPI.fetchCustomLists(user.id);
          const dbLogs = await dbAPI.fetchWatchLogs(user.id);

          // Ensure profile exists (auto-create if trigger failed)
          const emailPrefix = user.email ? user.email.split('@')[0] : 'Cinephile';
          const fallbackUsername = user.user_metadata?.username || `${emailPrefix}_${user.id.substring(0, 4)}`;
          const fallbackAvatar = user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/micah/svg?seed=Cinephile&backgroundColor=b6e3f4';
          const dbProfile = await dbAPI.ensureProfile(user.id, fallbackUsername, fallbackAvatar);

          set({
            movies: dbMovies,
            userLists: dbLists,
            watchLogs: dbLogs,
            profile: dbProfile,
            topFavorites: dbProfile?.top_favorites || [-1, -1, -1, -1],
          });
          get().updateChallenges();
        } catch (error) {
          console.error('Error fetching user cloud data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      syncLocalToCloud: async () => {
        const { user, movies, watchLogs, userLists, topFavorites, profile } = get();
        if (!user) return;
        set({ isLoading: true });
        try {
          // 1. Sync movies
          for (const movie of movies) {
            await dbAPI.upsertUserMovie(user.id, movie);
          }
          // 2. Sync watch logs
          for (const log of watchLogs) {
            await dbAPI.insertWatchLog(user.id, log);
          }
          // 3. Sync custom lists
          for (const list of userLists) {
            const cloudList = await dbAPI.createCustomList(user.id, list.name, list.description);
            if (cloudList) {
              await dbAPI.updateCustomListMovies(user.id, cloudList.id, list.movieIds);
            }
          }
          // 4. Sync profile & favorites
          if (profile) {
            await dbAPI.updateProfile(user.id, profile.username, profile.avatar_url, topFavorites);
          }
          // Reload
          await get().fetchUserData();
        } catch (error) {
          console.error('Error syncing local data to cloud:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateUserProfile: async (username, avatarUrl) => {
        const { user, topFavorites } = get();
        if (!user) return false;
        
        try {
          // Add a 10 second timeout safety net
          const success = await Promise.race([
            dbAPI.updateProfile(user.id, username, avatarUrl, topFavorites),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out after 10 seconds.')), 10000))
          ]);
          
          if (success) {
            const updatedProfile = await dbAPI.getProfile(user.id);
            set({ profile: updatedProfile });
            return true;
          }
          return false;
        } catch (error) {
          console.error('updateUserProfile error:', error);
          throw error; // Let EditProfileModal catch it and show error
        }
      },

      movies: [],
      addMovie: async (movie) => {
        const { user } = get();
        const movieWithDate = { ...movie, date_added: new Date().toISOString() };
        if (user) {
          await dbAPI.upsertUserMovie(user.id, movieWithDate);
          await get().fetchUserData();
        } else {
          set((state) => {
            if (state.movies.find((m) => m.id === movie.id)) return {};
            return { movies: [movieWithDate, ...state.movies] };
          });
        }
      },

      removeMovie: async (id) => {
        const { user } = get();
        if (user) {
          await dbAPI.deleteUserMovie(user.id, id);
          // Delete watch logs for this movie too (Supabase RLS/cascade handles this if linked, but let's delete locally/manually or refetch)
          await get().fetchUserData();
        } else {
          set((state) => {
            const filteredMovies = state.movies.filter((m) => m.id !== id);
            const filteredLogs = state.watchLogs.filter((log) => log.movieId !== id);
            const updatedLists = state.userLists.map((l) => ({
              ...l,
              movieIds: l.movieIds.filter((mid) => mid !== id),
            }));
            return {
              movies: filteredMovies,
              watchLogs: filteredLogs,
              userLists: updatedLists,
              topFavorites: state.topFavorites.map((favId) => (favId === id ? -1 : favId)),
            };
          });
          get().updateChallenges();
        }
      },

      addToWatchlist: async (movie) => {
        const { user } = get();
        if (user) {
          const target = get().movies.find((m) => m.id === movie.id);
          const updatedMovie = target
            ? { ...target, status: 'watchlist' as const }
            : { ...movie, status: 'watchlist' as const, date_added: new Date().toISOString() };
          await dbAPI.upsertUserMovie(user.id, updatedMovie);
          await get().fetchUserData();
        } else {
          set((state) => {
            if (state.movies.find((m) => m.id === movie.id)) {
              return {
                movies: state.movies.map((m) =>
                  m.id === movie.id ? { ...m, status: 'watchlist' as const } : m
                ),
              };
            }
            return { movies: [{ ...movie, status: 'watchlist', date_added: new Date().toISOString() }, ...state.movies] };
          });
        }
      },

      moveToWatched: async (id, rating) => {
        const { user } = get();
        if (user) {
          const target = get().movies.find((m) => m.id === id);
          if (!target) return;
          const updatedMovie = {
            ...target,
            status: 'watched' as const,
            user_rating: rating || target.user_rating || 0,
            date_watched: new Date().toISOString(),
          };
          await dbAPI.upsertUserMovie(user.id, updatedMovie);

          // Add watch log
          const alreadyLogged = get().watchLogs.some((l) => l.movieId === id);
          if (!alreadyLogged) {
            const newLog: WatchLog = {
              id: '', // database will generate it
              movieId: id,
              movieTitle: target.title,
              posterPath: target.poster_path,
              mediaType: target.media_type,
              date: new Date().toISOString(),
              rating: rating || 0,
              review: target.user_review || '',
              rewatch: false,
            };
            await dbAPI.insertWatchLog(user.id, newLog);
          }
          await get().fetchUserData();
        } else {
          set((state) => {
            const target = state.movies.find((m) => m.id === id);
            if (!target) return {};

            const updatedMovies = state.movies.map((m) =>
              m.id === id
                ? {
                    ...m,
                    status: 'watched' as const,
                    user_rating: rating || m.user_rating || 0,
                    date_watched: new Date().toISOString(),
                  }
                : m
            );

            const alreadyLogged = state.watchLogs.some((l) => l.movieId === id);
            let updatedLogs = state.watchLogs;
            if (!alreadyLogged) {
              const newLog: WatchLog = {
                id: Math.random().toString(36).substr(2, 9),
                movieId: id,
                movieTitle: target.title,
                posterPath: target.poster_path,
                mediaType: target.media_type,
                date: new Date().toISOString(),
                rating: rating || 0,
                review: target.user_review || '',
                rewatch: false,
              };
              updatedLogs = [newLog, ...state.watchLogs];
            }

            setTimeout(() => get().updateChallenges(), 50);

            return {
              movies: updatedMovies,
              watchLogs: updatedLogs,
            };
          });
        }
      },

      moveToWatchlist: async (id) => {
        const { user } = get();
        if (user) {
          const target = get().movies.find((m) => m.id === id);
          if (target) {
            const updatedMovie = {
              ...target,
              status: 'watchlist' as const,
              user_rating: undefined,
              user_review: undefined,
            };
            await dbAPI.upsertUserMovie(user.id, updatedMovie);
            await get().fetchUserData();
          }
        } else {
          set((state) => ({
            movies: state.movies.map((m) =>
              m.id === id ? { ...m, status: 'watchlist' as const, user_rating: undefined, user_review: undefined } : m
            ),
          }));
        }
      },

      updateRating: async (id, rating) => {
        const { user } = get();
        if (user) {
          const target = get().movies.find((m) => m.id === id);
          if (target) {
            await dbAPI.upsertUserMovie(user.id, { ...target, user_rating: rating });
            // Update rating in the latest watch log
            const latestLog = get().watchLogs.find((log) => log.movieId === id);
            if (latestLog) {
              // Wait, we don't have updateWatchLog dbAPI, but we can delete and re-insert or let it update locally.
              // To keep it simple, let's create a database update or let it reload. Since we reload anyway,
              // it's best to refetch. Wait! We can add a simple database update or just re-insert.
              // Actually, let's update watch_logs table in Supabase. How?
              // In supabase_setup.sql: watch_logs has an update policy. We can easily call it. Let's do:
              await supabase
                .from('watch_logs')
                .update({ rating })
                .eq('movie_id', id)
                .eq('user_id', user.id);
            }
            await get().fetchUserData();
          }
        } else {
          set((state) => {
            const updatedMovies = state.movies.map((m) =>
              m.id === id ? { ...m, user_rating: rating } : m
            );
            const updatedLogs = state.watchLogs.map((log) =>
              log.movieId === id ? { ...log, rating } : log
            );
            return { movies: updatedMovies, watchLogs: updatedLogs };
          });
        }
      },

      updateReview: async (id, review) => {
        const { user } = get();
        if (user) {
          const target = get().movies.find((m) => m.id === id);
          if (target) {
            await dbAPI.upsertUserMovie(user.id, { ...target, user_review: review });
            // Update review in the latest watch log
            const latestLog = get().watchLogs.find((log) => log.movieId === id);
            if (latestLog) {
              await supabase
                .from('watch_logs')
                .update({ review })
                .eq('movie_id', id)
                .eq('user_id', user.id);
            }
            await get().fetchUserData();
          }
        } else {
          set((state) => {
            const updatedMovies = state.movies.map((m) =>
              m.id === id ? { ...m, user_review: review } : m
            );
            const updatedLogs = state.watchLogs.map((log) =>
              log.movieId === id ? { ...log, review } : log
            );
            return { movies: updatedMovies, watchLogs: updatedLogs };
          });
        }
      },

      isInList: (id) => get().movies.some((m) => m.id === id),
      getMovieStatus: (id) => get().movies.find((m) => m.id === id)?.status || 'none',

      topFavorites: [-1, -1, -1, -1],
      setTopFavorite: async (index, id) => {
        const { user, profile, topFavorites } = get();
        const newFavorites = [...topFavorites];
        newFavorites[index] = id ?? -1;

        if (user && profile) {
          await dbAPI.updateProfile(user.id, profile.username, profile.avatar_url, newFavorites);
          await get().fetchUserData();
        } else {
          set({ topFavorites: newFavorites });
        }
      },

      // Custom Lists
      userLists: [],
      createUserList: async (name, description) => {
        const { user } = get();
        if (user) {
          await dbAPI.createCustomList(user.id, name, description);
          await get().fetchUserData();
        } else {
          set((state) => ({
            userLists: [
              ...state.userLists,
              {
                id: Math.random().toString(36).substr(2, 9),
                name,
                description,
                movieIds: [],
              },
            ],
          }));
        }
      },

      deleteUserList: async (id) => {
        const { user } = get();
        if (user) {
          await dbAPI.deleteCustomList(user.id, id);
          await get().fetchUserData();
        } else {
          set((state) => ({
            userLists: state.userLists.filter((l) => l.id !== id),
          }));
        }
      },

      addMovieToList: async (listId, movieId) => {
        const { user, userLists } = get();
        if (user) {
          const list = userLists.find((l) => l.id === listId);
          if (list && !list.movieIds.includes(movieId)) {
            const updatedMovieIds = [...list.movieIds, movieId];
            await dbAPI.updateCustomListMovies(user.id, listId, updatedMovieIds);
            await get().fetchUserData();
          }
        } else {
          set((state) => ({
            userLists: state.userLists.map((l) => {
              if (l.id !== listId) return l;
              if (l.movieIds.includes(movieId)) return l;
              return { ...l, movieIds: [...l.movieIds, movieId] };
            }),
          }));
        }
      },

      removeMovieFromList: async (listId, movieId) => {
        const { user, userLists } = get();
        if (user) {
          const list = userLists.find((l) => l.id === listId);
          if (list) {
            const updatedMovieIds = list.movieIds.filter((id) => id !== movieId);
            await dbAPI.updateCustomListMovies(user.id, listId, updatedMovieIds);
            await get().fetchUserData();
          }
        } else {
          set((state) => ({
            userLists: state.userLists.map((l) =>
              l.id === listId ? { ...l, movieIds: l.movieIds.filter((id) => id !== movieId) } : l
            ),
          }));
        }
      },

      // Watch log diary
      watchLogs: [],
      addWatchLog: async (movie, rating, review = '', rewatch = true, date = new Date().toISOString()) => {
        const { user } = get();
        if (user) {
          const newLog: WatchLog = {
            id: '',
            movieId: movie.id,
            movieTitle: movie.title,
            posterPath: movie.poster_path,
            mediaType: movie.media_type,
            date,
            rating,
            review,
            rewatch,
          };
          await dbAPI.insertWatchLog(user.id, newLog);

          // If adding a watch log, make sure movie is in state and marked as watched
          const hasMovie = get().movies.some((m) => m.id === movie.id);
          const targetMovie = get().movies.find((m) => m.id === movie.id);
          const updatedMovie = hasMovie
            ? { ...targetMovie!, status: 'watched' as const, user_rating: rating, user_review: review || targetMovie!.user_review }
            : { ...movie, status: 'watched' as const, user_rating: rating, user_review: review, date_watched: date, date_added: date };

          await dbAPI.upsertUserMovie(user.id, updatedMovie);
          await get().fetchUserData();
        } else {
          set((state) => {
            const newLog: WatchLog = {
              id: Math.random().toString(36).substr(2, 9),
              movieId: movie.id,
              movieTitle: movie.title,
              posterPath: movie.poster_path,
              mediaType: movie.media_type,
              date,
              rating,
              review,
              rewatch,
            };

            const hasMovie = state.movies.some((m) => m.id === movie.id);
            let updatedMovies = state.movies;
            if (!hasMovie) {
              updatedMovies = [
                { ...movie, status: 'watched' as const, user_rating: rating, user_review: review, date_watched: date },
                ...state.movies,
              ];
            } else {
              updatedMovies = state.movies.map((m) =>
                m.id === movie.id
                  ? { ...m, status: 'watched' as const, user_rating: rating, user_review: review || m.user_review }
                  : m
              );
            }

            setTimeout(() => get().updateChallenges(), 50);

            return {
              watchLogs: [newLog, ...state.watchLogs],
              movies: updatedMovies,
            };
          });
        }
      },

      removeWatchLog: async (id) => {
        const { user } = get();
        if (user) {
          await dbAPI.deleteWatchLog(user.id, id);
          await get().fetchUserData();
        } else {
          set((state) => {
            const filteredLogs = state.watchLogs.filter((log) => log.id !== id);
            return { watchLogs: filteredLogs };
          });
        }
      },

      // AI Chat History
      aiChatHistory: [
        {
          id: 'welcome',
          sender: 'ai',
          text: "Hey! I am your AI Cine-Advisor. I've analyzed your watched titles, reviews, and taste parameters. Ask me anything, request custom recommendations, or get a harsh critique of your movie choices!",
          timestamp: new Date().toISOString(),
        },
      ],
      addChatMessage: (sender, text) =>
        set((state) => ({
          aiChatHistory: [
            ...state.aiChatHistory,
            {
              id: Math.random().toString(36).substr(2, 9),
              sender,
              text,
              timestamp: new Date().toISOString(),
            },
          ],
        })),
      clearChatHistory: () =>
        set({
          aiChatHistory: [
            {
              id: 'welcome',
              sender: 'ai',
              text: "Reset complete! Let's start fresh. Tell me, what kind of cinematic mood are you in?",
              timestamp: new Date().toISOString(),
            },
          ],
        }),

      // Community Challenges
      challenges: DEFAULT_CHALLENGES,
      updateChallenges: () => {
        const state = get();
        const watched = state.movies.filter((m) => m.status === 'watched');

        const updatedChallenges = state.challenges.map((challenge) => {
          let currentCount = 0;
          if (challenge.type === 'count') {
            currentCount = watched.length;
          } else if (challenge.type === 'genre') {
            currentCount = watched.filter((m) => m.genres.includes(challenge.param)).length;
          } else if (challenge.type === 'language') {
            currentCount = watched.filter((m) =>
              m.spoken_languages.some((l) => l !== challenge.param)
            ).length;
          } else if (challenge.type === 'director') {
            const counts: Record<string, number> = {};
            watched.forEach((m) => {
              m.directors.forEach((d) => {
                counts[d] = (counts[d] || 0) + 1;
              });
            });
            currentCount = Math.max(...Object.values(counts), 0);
          }

          const completed = currentCount >= challenge.targetCount;
          return {
            ...challenge,
            currentCount,
            completed,
          };
        });

        set({ challenges: updatedChallenges });
      },
      addCustomChallenge: (title, description, targetCount, type, param) => {
        const newChallenge: CommunityChallenge = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          description,
          targetCount,
          currentCount: 0,
          type,
          param,
          completed: false,
        };
        set((state) => ({
          challenges: [...state.challenges, newChallenge],
        }));
        get().updateChallenges();
      },
      deleteChallenge: (id) => {
        set((state) => ({
          challenges: state.challenges.filter((c) => c.id !== id),
        }));
      },

      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'binge-buddy-storage-v2',
      // Only persist non-database details locally (like apiKey and local state fallback)
      partialize: (state) => ({
        apiKey: state.apiKey,
        geminiApiKey: state.geminiApiKey,
        movies: state.user ? [] : state.movies,
        userLists: state.user ? [] : state.userLists,
        watchLogs: state.user ? [] : state.watchLogs,
        topFavorites: state.user ? [-1, -1, -1, -1] : state.topFavorites,
        aiChatHistory: state.aiChatHistory,
        challenges: state.challenges,
      }),
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        // Fallback to env variables if stored keys are not set or blank
        if (!merged.geminiApiKey && import.meta.env.VITE_GEMINI_API_KEY) {
          merged.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        }
        if (!merged.apiKey && import.meta.env.VITE_TMDB_API_KEY) {
          merged.apiKey = import.meta.env.VITE_TMDB_API_KEY;
        }
        return merged;
      },
    }
  )
);
