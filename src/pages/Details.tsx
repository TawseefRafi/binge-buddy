import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar, Globe, Plus, Check, Loader2, BookmarkX, MessageSquare, ListPlus, Send, CornerDownRight, Trash2, Users, LogIn } from 'lucide-react';
import { tmdbApi, IMG } from '../lib/tmdb';
import { useStore } from '../store/useStore';
import type { Movie } from '../lib/types';
import { ContentRow } from '../components/ContentRow';
import { StarRating } from '../components/StarRating';
import { PersonDrawer } from '../components/PersonDrawer';
import { getMovieAwards } from '../lib/awardsData';
import { dbAPI, isSupabaseConfigured } from '../lib/supabase';
import type { DBThread, DBReply } from '../lib/supabase';

const getAwardEmoji = (awardName: string) => {
  switch (awardName) {
    case 'Oscar': return '🏆';
    case 'Palme d\'Or': return '🌿';
    case 'Golden Globe': return '🔮';
    case 'BAFTA': return '🎭';
    case 'Emmy': return '📺';
    case 'Venice Golden Lion': return '🦁';
    case 'Berlin Golden Bear': return '🐻';
    case 'Sundance Grand Jury': return '❄️';
    case 'Anime Award': return '🌸';
    default: return '🏆';
  }
};

export function Details() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const navigate = useNavigate();
  const {
    apiKey,
    addToWatchlist,
    removeMovie,
    moveToWatched,
    getMovieStatus,
    updateRating,
    updateReview,
    movies,
    userLists,
    createUserList,
    addMovieToList,
    removeMovieFromList,
    addWatchLog,
    user,
    profile
  } = useStore();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [activePersonId, setActivePersonId] = useState<number | null>(null);

  // Rewatch modal state
  const [showRewatchModal, setShowRewatchModal] = useState(false);
  const [rewatchRating, setRewatchRating] = useState(5);
  const [rewatchReview, setRewatchReview] = useState('');
  const [rewatchDate, setRewatchDate] = useState(new Date().toISOString().split('T')[0]);

  // Create list input state
  const [newListName, setNewListName] = useState('');

  // Community Critiques & Discussion states
  const [communityThreads, setCommunityThreads] = useState<DBThread[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, DBReply[]>>({});
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});
  
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const fetchCommunityThreads = async () => {
    if (!isSupabaseConfigured || !movie) return;
    setLoadingCommunity(true);
    try {
      const allThreads = await dbAPI.fetchCommunityThreads();
      const filtered = allThreads.filter(
        (t) => t.movie_title && t.movie_title.toLowerCase() === movie.title.toLowerCase()
      );
      setCommunityThreads(filtered);
    } catch (err) {
      console.error('Error fetching community critiques:', err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  useEffect(() => {
    if (movie) {
      fetchCommunityThreads();
    }
  }, [movie]);

  const fetchReplies = async (threadId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const replies = await dbAPI.fetchCommunityReplies(threadId);
      setRepliesMap((prev) => ({ ...prev, [threadId]: replies }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleThreadReplies = (threadId: string) => {
    if (expandedThreadId === threadId) {
      setExpandedThreadId(null);
    } else {
      setExpandedThreadId(threadId);
      if (!repliesMap[threadId]) {
        fetchReplies(threadId);
      }
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !movie || !newReviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const contentPayload = `[RATING:${newReviewRating}]${newReviewText.trim()}`;
      const newThread = await dbAPI.createCommunityThread(
        user.id,
        profile.username,
        profile.avatar_url || '',
        `Review: ${movie.title}`,
        contentPayload,
        movie.title
      );

      if (newThread) {
        setCommunityThreads((prev) => [newThread, ...prev]);
        setNewReviewText('');
        setNewReviewRating(5);
      }
    } catch (err) {
      console.error('Error posting critique:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (threadId: string) => {
    const replyText = replyInputs[threadId];
    if (!user || !profile || !replyText || !replyText.trim()) return;

    setSubmittingReply((prev) => ({ ...prev, [threadId]: true }));
    try {
      const newReply = await dbAPI.createCommunityReply(
        threadId,
        user.id,
        profile.username,
        profile.avatar_url || '',
        replyText.trim()
      );

      if (newReply) {
        setRepliesMap((prev) => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), newReply],
        }));
        setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm('Are you sure you want to delete your critique?');
    if (!confirmDelete) return;

    try {
      const success = await dbAPI.deleteCommunityThread(user.id, threadId);
      if (success) {
        setCommunityThreads((prev) => prev.filter((t) => t.id !== threadId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const parseThreadRatingAndContent = (content: string) => {
    const match = content.match(/^\[RATING:(\d+(\.\d+)?)\]/);
    if (match) {
      const rating = Number(match[1]);
      const cleanContent = content.replace(/^\[RATING:(\d+(\.\d+)?)\]/, '');
      return { rating, content: cleanContent };
    }
    return { rating: null, content };
  };

  useEffect(() => {
    if (!apiKey || !id) return;
    setLoading(true);
    setError(null);

    // Primary type from URL, fallback if it's not movie or tv
    const primaryType = (mediaType === 'tv' || mediaType === 'movie') ? mediaType : 'movie';
    const secondaryType = primaryType === 'movie' ? 'tv' : 'movie';

    tmdbApi.getDetails(Number(id), primaryType, apiKey)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn(`Primary fetch for ${primaryType} failed. Trying fallback ${secondaryType}...`, err);
        tmdbApi.getDetails(Number(id), secondaryType, apiKey)
          .then((data) => {
            setMovie(data);
            setLoading(false);
          })
          .catch((err2) => {
            console.error("Both fetch attempts failed", err2);
            setError("Failed to fetch details from TMDB. Please check if this item exists or verify your connection.");
            setLoading(false);
          });
      });
  }, [apiKey, id, mediaType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="p-8 max-w-md glass border border-white/10 rounded-2xl shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
          <h2 className="text-xl font-bold text-white">Cinema Details Not Found</h2>
          <p className="text-xs text-muted-light">
            {error || "We couldn't retrieve details for this content. It might be unavailable or the media type is incorrect."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = getMovieStatus(movie.id);
  const storedMovie = movies.find(m => m.id === movie.id);
  const userRating = storedMovie?.user_rating || 0;
  const userReview = storedMovie?.user_review || '';
  const movieAwards = getMovieAwards(movie.id);

  const handleAddToWatchlist = () => {
    addToWatchlist(movie);
  };

  const handleMarkWatched = () => {
    if (status === 'none') addToWatchlist(movie);
    moveToWatched(movie.id, 0);
  };

  const handleRate = (r: number) => {
    if (status === 'none' || status === 'watchlist') {
      if (status === 'none') addToWatchlist(movie);
      moveToWatched(movie.id, r);
    } else {
      updateRating(movie.id, r);
    }
  };

  const handleSaveReview = () => {
    updateReview(movie.id, reviewText);
    setShowReviewInput(false);
  };

  const handleCreateList = () => {
    const val = newListName.trim();
    if (val) {
      createUserList(val, `Custom list for ${val}`);
      setNewListName('');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop */}
      <div className="relative w-full h-[50vh] min-h-[400px]">
        {movie.backdrop_path ? (
          <img src={IMG.backdrop(movie.backdrop_path)!} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 rounded-full glass hover:bg-white/10 text-white transition-all z-20">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-10 -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0">
            {movie.poster_path ? (
              <img src={IMG.poster(movie.poster_path, 'w342')!} alt={movie.title} className="w-48 md:w-56 rounded-2xl shadow-2xl shadow-black/50 border border-white/10" />
            ) : (
              <div className="w-48 md:w-56 aspect-[2/3] rounded-2xl bg-surface-light flex items-center justify-center text-muted">{movie.title}</div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 pt-4 md:pt-24">
            {movie.tagline && <p className="text-primary text-sm font-medium italic mb-2">"{movie.tagline}"</p>}
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">{movie.title}</h1>

            {/* Awards & Accolades Badges */}
            {movieAwards.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                {movieAwards.map((award, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/30 rounded-lg text-[11px] font-semibold text-gold shadow-[0_0_10px_rgba(234,179,8,0.05)] hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:border-gold/50 transition-all cursor-default"
                    title={`${award.category} (${award.year})`}
                  >
                    <span>{getAwardEmoji(award.award)}</span>
                    <span>{award.award} – {award.category} ({award.year})</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-light">
              {movie.release_date && (
                <span className="flex items-center gap-1"><Calendar size={14} /> {movie.release_date.substring(0, 4)}</span>
              )}
              {movie.runtime && movie.runtime > 0 && (
                <span className="flex items-center gap-1"><Clock size={14} /> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
              )}
              {movie.number_of_seasons && (
                <span>{movie.number_of_seasons} Season{movie.number_of_seasons > 1 ? 's' : ''}</span>
              )}
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 text-gold font-semibold mr-2">
                  <Star size={14} className="fill-gold" /> {movie.vote_average.toFixed(1)}
                  <span className="text-muted font-normal">({movie.vote_count})</span>
                </span>
              )}
              
              {/* External Scores/Links */}
              <div className="flex items-center gap-2">
                {movie.imdb_id && (
                  <a href={`https://www.imdb.com/title/${movie.imdb_id}`} target="_blank" rel="noreferrer" className="flex items-center hover:scale-105 transition-transform" title="View on IMDb">
                    <span className="bg-[#f5c518] text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">IMDb</span>
                  </a>
                )}
                <a href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(movie.title)}`} target="_blank" rel="noreferrer" className="flex items-center hover:scale-105 transition-transform" title="Search on Rotten Tomatoes">
                  <span className="bg-[#fa320a] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">RT</span>
                </a>
                <a href={`https://letterboxd.com/search/${encodeURIComponent(movie.title)}/`} target="_blank" rel="noreferrer" className="flex items-center hover:scale-105 transition-transform" title="Search on Letterboxd">
                  <span className="bg-[#202830] text-[#00e054] border border-[#00e054]/50 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">LBXD</span>
                </a>
              </div>
              {movie.origin_country.length > 0 && (
                <span className="flex items-center gap-1"><Globe size={14} /> {movie.origin_country.join(', ')}</span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map(g => (
                <span key={g} className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full">{g}</span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              {status === 'none' && (
                <button onClick={handleAddToWatchlist} className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all glow-border">
                  <Plus size={18} /> Add to Watchlist
                </button>
              )}
              {status === 'watchlist' && (
                <>
                  <button className="flex items-center gap-2 px-5 py-3 bg-success/15 text-success font-semibold rounded-xl border border-success/30 cursor-default">
                    <Check size={18} /> In Watchlist
                  </button>
                  <button onClick={handleMarkWatched} className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
                    <Star size={18} /> Mark as Watched
                  </button>
                </>
              )}
              {status === 'watched' && (
                <button className="flex items-center gap-2 px-5 py-3 bg-gold/15 text-gold font-semibold rounded-xl border border-gold/30 cursor-default">
                  <Check size={18} /> Watched
                </button>
              )}
              {status !== 'none' && (
                <button onClick={() => removeMovie(movie.id)} className="flex items-center gap-2 px-5 py-3 bg-danger/10 text-danger font-semibold rounded-xl hover:bg-danger/20 transition-all">
                  <BookmarkX size={18} /> Remove
                </button>
              )}
            </div>

            {/* Custom Lists Selector */}
            <div className="mb-6 p-5 glass-light rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold text-muted-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ListPlus size={14} className="text-primary" /> Add to Custom Lists
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {userLists.map(list => {
                  const hasMovie = list.movieIds.includes(movie.id);
                  return (
                    <button
                      key={list.id}
                      onClick={() => hasMovie ? removeMovieFromList(list.id, movie.id) : addMovieToList(list.id, movie.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        hasMovie
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-white/10 hover:border-white/20 text-gray-300 bg-white/5'
                      }`}
                    >
                      {list.name} {hasMovie ? '✓' : '+'}
                    </button>
                  );
                })}
                {userLists.length === 0 && (
                  <p className="text-xs text-muted-light">No custom lists created yet. Create one below!</p>
                )}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  placeholder="New list name..."
                  className="flex-1 px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleCreateList}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Your Rating & Rewatches */}
            <div className="mb-6 p-5 glass-light rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-muted-light uppercase tracking-wider mb-2">Your Rating</h3>
                <StarRating rating={userRating} onRate={handleRate} interactive />
              </div>
              {status === 'watched' && (
                <button
                  onClick={() => setShowRewatchModal(true)}
                  className="px-4 py-2.5 bg-primary/25 hover:bg-primary/35 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Star size={14} className="fill-primary text-primary" /> Log Another Rewatch
                </button>
              )}
            </div>

            {/* Overview */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-3">Overview</h3>
              <p className="text-sm leading-relaxed text-gray-400">{movie.overview || 'No overview available.'}</p>
            </div>

            {/* Directors */}
            {movie.directors_list && movie.directors_list.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  {movie.media_type === 'tv' ? 'Created By' : 'Directed By'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.directors_list.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setActivePersonId(d.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-primary/20 hover:border-primary/50 transition-all font-semibold cursor-pointer"
                    >
                      {d.profile_path ? (
                        <img
                          src={IMG.profile(d.profile_path, 'w45')!}
                          alt=""
                          className="w-5 h-5 object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-[10px]">🎬</span>
                      )}
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : movie.directors.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  {movie.media_type === 'tv' ? 'Created By' : 'Directed By'}
                </h3>
                <p className="text-white font-medium">{movie.directors.join(', ')}</p>
              </div>
            ) : null}

            {/* Languages */}
            {movie.spoken_languages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Languages</h3>
                <p className="text-gray-300">{movie.spoken_languages.join(', ')}</p>
              </div>
            )}

            {/* Write a Review */}
            {status === 'watched' && (
              <div className="mb-8">
                {userReview ? (
                  <div className="p-5 glass-light rounded-2xl border border-white/5">
                    <h3 className="text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Your Critique</h3>
                    <p className="text-sm text-gray-300 italic">"{userReview}"</p>
                    <button onClick={() => { setReviewText(userReview); setShowReviewInput(true); }} className="mt-3 text-xs text-primary hover:underline">Edit Critique</button>
                  </div>
                ) : (
                  <button onClick={() => setShowReviewInput(true)} className="flex items-center gap-2 text-sm text-primary hover:text-primary-light transition-colors">
                    <MessageSquare size={16} /> Criticize / Write a review...
                  </button>
                )}
                {showReviewInput && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your heavy critiques about this cinema..."
                      className="w-full h-28 p-4 text-sm bg-surface border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary/50 resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSaveReview} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark">Save</button>
                      <button onClick={() => setShowReviewInput(false)} className="px-4 py-2 text-muted text-sm rounded-lg hover:bg-white/5">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Cast */}
        {movie.cast.length > 0 && (
          <div className="mt-12 mb-12">
            <h3 className="text-xl font-bold text-white mb-6">Cast</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 carousel-scroll">
              {movie.cast.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setActivePersonId(c.id)}
                  className="flex flex-col items-center w-24 flex-shrink-0 group cursor-pointer"
                >
                  {c.profile_path ? (
                    <img 
                      src={IMG.profile(c.profile_path)!} 
                      alt={c.name} 
                      className="w-20 h-20 object-cover rounded-full mb-2 border-2 border-transparent group-hover:border-primary/50 transition-all animate-none" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mb-2 border border-border text-muted text-sm font-bold">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <span className="text-xs text-center text-white font-medium truncate w-full group-hover:text-primary transition-colors">{c.name}</span>
                  <span className="text-[10px] text-center text-muted truncate w-full">{c.character}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar & Recommendations */}
        {movie.similar && movie.similar.length > 0 && (
          <ContentRow title="More Like This" items={movie.similar} mediaType={movie.media_type} />
        )}
        {movie.recommendations && movie.recommendations.length > 0 && (
          <ContentRow title="Recommended" items={movie.recommendations} mediaType={movie.media_type} />
        )}

        {/* Community Critiques & Discussion */}
        <div className="mt-16 mb-12">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Users size={24} className="text-primary animate-pulse" /> Community Critiques & Discussion
              </h3>
              <p className="text-xs text-muted-light mt-1">
                Read critiques from other cinephiles, submit your ratings, and take part in inline discussions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {loadingCommunity && (
                <div className="flex items-center justify-center py-12">
                  <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                </div>
              )}

              {!loadingCommunity && communityThreads.length === 0 && (
                <div className="p-10 glass border border-white/5 rounded-2xl text-center text-muted-light text-xs">
                  No community critiques published for this title yet. Be the first to share your thoughts!
                </div>
              )}

              {!loadingCommunity &&
                communityThreads.map((item) => {
                  const { rating, content: cleanContent } = parseThreadRatingAndContent(item.content);
                  const isOwner = user && user.id === item.user_id;

                  return (
                    <div key={item.id} className="p-5 glass rounded-2xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                            alt={item.username}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white">{item.username}</h4>
                            <span className="text-[9px] text-primary uppercase font-bold tracking-wider">Cinephile Critic</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-light">{new Date(item.created_at).toLocaleDateString()}</span>
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteThread(item.id)}
                              className="text-muted hover:text-red-400 p-1.5 rounded transition-colors cursor-pointer"
                              title="Delete critique"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        {rating !== null && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <StarRating rating={rating} size={12} interactive={false} />
                          </div>
                        )}
                        <p className="text-xs md:text-sm text-gray-300 leading-relaxed italic">
                          "{cleanContent}"
                        </p>
                      </div>

                      {/* Expandable replies button */}
                      <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
                        <button
                          onClick={() => toggleThreadReplies(item.id)}
                          className="w-max flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors font-semibold cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          {expandedThreadId === item.id ? 'Hide Discussion' : 'Join Discussion'}
                          {repliesMap[item.id] && repliesMap[item.id].length > 0 && ` (${repliesMap[item.id].length})`}
                        </button>

                        {/* Replies Area */}
                        {expandedThreadId === item.id && (
                          <div className="pl-4 border-l-2 border-primary/20 space-y-3 mt-2">
                            {repliesMap[item.id]?.map((reply) => (
                              <div key={reply.id} className="flex gap-2.5 items-start">
                                <img
                                  src={reply.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                                  alt={reply.username}
                                  className="w-6 h-6 rounded-full object-cover border border-white/10"
                                />
                                <div className="flex-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-bold text-white">{reply.username}</span>
                                    <span className="text-[9px] text-muted">{new Date(reply.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-gray-300">{reply.content}</p>
                                </div>
                              </div>
                            ))}

                            {/* Write a reply */}
                            {user ? (
                              <div className="flex gap-2 mt-4 items-center">
                                <CornerDownRight size={16} className="text-muted" />
                                <input
                                  type="text"
                                  value={replyInputs[item.id] || ''}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                                  }
                                  placeholder="Write a comment..."
                                  onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(item.id)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                                />
                                <button
                                  onClick={() => handleReplySubmit(item.id)}
                                  disabled={submittingReply[item.id]}
                                  className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  <Send size={11} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-light mt-3 flex items-center gap-1">
                                <LogIn size={11} /> Log in to write a comment reply.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Critique Form Column */}
            <div className="space-y-4">
              <div className="p-5 glass rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-primary" /> Post Your Critique
                </h3>

                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Your Rating</label>
                      <StarRating rating={newReviewRating} onRate={setNewReviewRating} interactive />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Critique Text</label>
                      <textarea
                        required
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="Share your deep analysis on this cinema..."
                        className="w-full h-32 p-3 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50 resize-none placeholder-gray-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
                    >
                      {submittingReview ? 'Posting...' : 'Publish Critique'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-light mb-4">You need to be logged in to share critiques in the community section.</p>
                    <span className="inline-block text-xs font-bold text-primary flex items-center gap-1 justify-center">
                      <LogIn size={14} /> Log in from the onboarding/auth flow
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rewatch Modal */}
      <AnimatePresence>
        {showRewatchModal && (
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
              className="w-full max-w-md p-6 glass-panel rounded-2xl shadow-2xl relative overflow-hidden"
            >
              {/* Decorative line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
              
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🍿 Log Rewatch
              </h2>
              <p className="text-xs text-muted-light mb-4">Add a new historical entry to your watch diary for <strong>{movie.title}</strong>.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Rating</label>
                  <StarRating rating={rewatchRating} onRate={setRewatchRating} interactive />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Review / Notes</label>
                  <textarea
                    value={rewatchReview}
                    onChange={(e) => setRewatchReview(e.target.value)}
                    placeholder="Describe this viewing session..."
                    className="w-full h-24 p-3 text-sm bg-black/35 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Watch Date</label>
                  <input
                    type="date"
                    value={rewatchDate}
                    onChange={(e) => setRewatchDate(e.target.value)}
                    className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowRewatchModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      addWatchLog(movie, rewatchRating, rewatchReview, true, new Date(rewatchDate).toISOString());
                      setRewatchReview('');
                      setShowRewatchModal(false);
                    }}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  >
                    Save Log Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Person Info Drawer */}
      <PersonDrawer personId={activePersonId} onClose={() => setActivePersonId(null)} />
    </div>
  );
}
