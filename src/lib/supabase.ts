import { createClient } from '@supabase/supabase-js';
import type { Movie } from './types';
import type { CustomList, WatchLog } from '../store/useStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock or disabled client if credentials are missing
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-key') &&
  !supabaseAnonKey.includes('your-anon-key')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing! Binge Buddy is falling back to LocalStorage guest mode. Copy .env.example to .env to configure the cloud database.'
  );
}

// Instantiate client safely
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'binge-buddy-auth',
        // Bypass the Navigator Lock that causes deadlocks on Netlify/static hosts
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn();
        },
      },
      global: {
        fetch: (...args) => fetch(...args),
      },
    })
  : (null as any);

// Types matching the DB schema
export interface DBProfile {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  top_favorites?: number[];
}

export interface DBThread {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  title: string;
  content: string;
  movie_title: string | null;
  created_at: string;
}

export interface DBReply {
  id: string;
  thread_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

// Map database movie to frontend Movie type
function mapDbMovie(dbMovie: any): Movie {
  return {
    id: dbMovie.tmdb_id,
    title: dbMovie.title,
    original_title: dbMovie.original_title || '',
    poster_path: dbMovie.poster_path,
    backdrop_path: dbMovie.backdrop_path,
    release_date: dbMovie.release_date || '',
    overview: dbMovie.overview || '',
    runtime: dbMovie.runtime,
    genres: dbMovie.genres || [],
    directors: dbMovie.directors || [],
    cast: dbMovie.cast || [],
    origin_country: dbMovie.origin_country || [],
    spoken_languages: dbMovie.spoken_languages || [],
    vote_average: Number(dbMovie.vote_average) || 0,
    vote_count: dbMovie.vote_count || 0,
    status: dbMovie.status as 'watchlist' | 'watched',
    user_rating: dbMovie.user_rating !== null ? Number(dbMovie.user_rating) : undefined,
    user_review: dbMovie.user_review || undefined,
    media_type: dbMovie.media_type as 'movie' | 'tv',
    tagline: dbMovie.tagline || undefined,
    number_of_seasons: dbMovie.number_of_seasons || undefined,
    number_of_episodes: dbMovie.number_of_episodes || undefined,
    date_added: dbMovie.date_added,
    date_watched: dbMovie.date_watched || undefined,
  };
}

// DB Operations
export const dbAPI = {
  // Profiles
  async getProfile(userId: string): Promise<DBProfile | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async fetchAllProfiles(): Promise<DBProfile[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
    return data || [];
  },

  async updateProfile(userId: string, username: string, avatarUrl: string, topFavorites?: number[]): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const payload: any = { id: userId, username, avatar_url: avatarUrl };
    if (topFavorites) payload.top_favorites = topFavorites;
    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    return true;
  },

  async ensureProfile(userId: string, username: string, avatarUrl: string): Promise<DBProfile | null> {
    if (!isSupabaseConfigured) return null;
    // Try to get existing profile first
    const existing = await this.getProfile(userId);
    if (existing) return existing;
    // Profile doesn't exist — create it (trigger may have failed)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username,
        avatar_url: avatarUrl,
        top_favorites: [-1, -1, -1, -1],
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('Error ensuring profile:', error);
      return null;
    }
    return data;
  },

  // User Movies (Private Watchlist/Watched)
  async fetchUserMovies(userId: string): Promise<Movie[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', userId)
      .order('date_added', { ascending: false });
    if (error) {
      console.error('Error fetching user movies:', error);
      return [];
    }
    return (data || []).map(mapDbMovie);
  },

  async upsertUserMovie(userId: string, movie: Movie): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const dbPayload = {
      user_id: userId,
      tmdb_id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      overview: movie.overview,
      runtime: movie.runtime,
      genres: movie.genres,
      directors: movie.directors,
      cast: movie.cast,
      origin_country: movie.origin_country,
      spoken_languages: movie.spoken_languages,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      status: movie.status,
      user_rating: movie.user_rating ?? null,
      user_review: movie.user_review ?? null,
      media_type: movie.media_type,
      tagline: movie.tagline ?? null,
      number_of_seasons: movie.number_of_seasons ?? null,
      number_of_episodes: movie.number_of_episodes ?? null,
      date_added: movie.date_added || new Date().toISOString(),
      date_watched: movie.date_watched ?? null,
    };

    const { error } = await supabase
      .from('user_movies')
      .upsert(dbPayload, { onConflict: 'user_id,tmdb_id' });

    if (error) {
      console.error('Error upserting movie:', error);
      return false;
    }
    return true;
  },

  async deleteUserMovie(userId: string, tmdbId: number): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('user_movies')
      .delete()
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId);
    if (error) {
      console.error('Error deleting movie:', error);
      return false;
    }
    return true;
  },

  // Custom Lists (Private)
  async fetchCustomLists(userId: string): Promise<CustomList[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('custom_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching custom lists:', error);
      return [];
    }
    return (data || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      description: l.description || '',
      movieIds: l.movie_ids || [],
    }));
  },

  async createCustomList(userId: string, name: string, description: string): Promise<CustomList | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('custom_lists')
      .insert({ user_id: userId, name, description, movie_ids: [] })
      .select()
      .single();
    if (error) {
      console.error('Error creating custom list:', error);
      return null;
    }
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      movieIds: data.movie_ids || [],
    };
  },

  async updateCustomListMovies(userId: string, listId: string, movieIds: number[]): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('custom_lists')
      .update({ movie_ids: movieIds })
      .eq('id', listId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error updating custom list:', error);
      return false;
    }
    return true;
  },

  async deleteCustomList(userId: string, listId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('custom_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error deleting custom list:', error);
      return false;
    }
    return true;
  },

  // Watch Logs / History (Private)
  async fetchWatchLogs(userId: string): Promise<WatchLog[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('watch_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching watch logs:', error);
      return [];
    }
    return (data || []).map((log: any) => ({
      id: log.id,
      movieId: log.movie_id,
      movieTitle: log.movie_title,
      posterPath: log.poster_path,
      mediaType: log.media_type as 'movie' | 'tv',
      date: log.date,
      rating: Number(log.rating),
      review: log.review || undefined,
      rewatch: log.rewatch,
    }));
  },

  async insertWatchLog(userId: string, log: WatchLog): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('watch_logs')
      .insert({
        user_id: userId,
        movie_id: log.movieId,
        movie_title: log.movieTitle,
        poster_path: log.posterPath,
        media_type: log.mediaType,
        date: log.date,
        rating: log.rating,
        review: log.review || null,
        rewatch: log.rewatch,
      })
      .select()
      .single();
    if (error) {
      console.error('Error inserting watch log:', error);
      return null;
    }
    return data.id;
  },

  async deleteWatchLog(userId: string, logId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('watch_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error deleting watch log:', error);
      return false;
    }
    return true;
  },

  // Community Threads (Shared)
  async fetchCommunityThreads(): Promise<DBThread[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('community_threads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching community threads:', error);
      return [];
    }
    return data || [];
  },

  async createCommunityThread(
    userId: string,
    username: string,
    avatarUrl: string,
    title: string,
    content: string,
    movieTitle?: string
  ): Promise<DBThread | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('community_threads')
      .insert({
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        title,
        content,
        movie_title: movieTitle || null,
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating thread:', error);
      return null;
    }
    return data;
  },

  async deleteCommunityThread(userId: string, threadId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('community_threads')
      .delete()
      .eq('id', threadId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error deleting thread:', error);
      return false;
    }
    return true;
  },

  // Community Replies (Shared)
  async fetchCommunityReplies(threadId: string): Promise<DBReply[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('community_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
    return data || [];
  },

  async createCommunityReply(
    threadId: string,
    userId: string,
    username: string,
    avatarUrl: string,
    content: string
  ): Promise<DBReply | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('community_replies')
      .insert({
        thread_id: threadId,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        content,
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating reply:', error);
      return null;
    }
    return data;
  },
};
