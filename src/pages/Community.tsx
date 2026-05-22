import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { dbAPI, isSupabaseConfigured } from '../lib/supabase';
import type { DBThread, DBReply, DBProfile } from '../lib/supabase';
import { Users, Send, MessageSquare, Award, PlayCircle, Trophy, Sparkles, LogIn, CornerDownRight, Trash2 } from 'lucide-react';
import { StarRating } from '../components/StarRating';

export function CommunityHub() {
  const { user, profile, challenges, updateChallenges, addCustomChallenge, deleteChallenge } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'reviews' | 'discussions' | 'challenges'>('reviews');

  // Supabase community data
  const [threads, setThreads] = useState<DBThread[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, DBReply[]>>({});
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [members, setMembers] = useState<DBProfile[]>([]);

  // Loading states
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [submittingThread, setSubmittingThread] = useState(false);
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Review Thread Form States
  const [newReviewMovie, setNewReviewMovie] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');

  // General Thread Form States
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showThreadForm, setShowThreadForm] = useState(false);

  // Reply Form States
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Custom Challenge Form States
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeTargetCount, setChallengeTargetCount] = useState(3);
  const [challengeType, setChallengeType] = useState<'genre' | 'director' | 'language' | 'count'>('genre');
  const [challengeParam, setChallengeParam] = useState('');

  // Load threads on tab switch
  useEffect(() => {
    fetchThreads();
    fetchMembers();
    updateChallenges();
  }, [activeSubTab]);

  const fetchMembers = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await Promise.race([
        dbAPI.fetchAllProfiles(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      setMembers(data);
    } catch (e) {
      console.error('fetchMembers:', e);
    }
  };

  const fetchThreads = async () => {
    if (!isSupabaseConfigured) return;
    setLoadingThreads(true);
    try {
      const data = await Promise.race([
        dbAPI.fetchCommunityThreads(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      setThreads(data);
    } catch (e) {
      console.error('fetchThreads:', e);
    } finally {
      setLoadingThreads(false);
    }
  };

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

  // Submit Movie Review Thread
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newReviewMovie.trim() || !newReviewText.trim()) return;

    setSubmittingThread(true);
    try {
      const contentPayload = `[RATING:${newReviewRating}]${newReviewText}`;
      const newThread = await dbAPI.createCommunityThread(
        user.id,
        profile.username,
        profile.avatar_url,
        `Review: ${newReviewMovie}`,
        contentPayload,
        newReviewMovie.trim()
      );

      if (newThread) {
        setThreads((prev) => [newThread, ...prev]);
        setNewReviewMovie('');
        setNewReviewText('');
        setNewReviewRating(5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingThread(false);
    }
  };

  // Submit General Discussion Thread
  const handleThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newThreadTitle.trim() || !newThreadContent.trim()) return;

    setSubmittingThread(true);
    try {
      const newThread = await dbAPI.createCommunityThread(
        user.id,
        profile.username,
        profile.avatar_url,
        newThreadTitle.trim(),
        newThreadContent.trim()
      );

      if (newThread) {
        setThreads((prev) => [newThread, ...prev]);
        setNewThreadTitle('');
        setNewThreadContent('');
        setShowThreadForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingThread(false);
    }
  };

  // Submit Thread Reply
  const handleReplySubmit = async (threadId: string) => {
    const replyText = replyInputs[threadId];
    if (!user || !profile || !replyText || !replyText.trim()) return;

    setSubmittingReply((prev) => ({ ...prev, [threadId]: true }));
    try {
      const newReply = await dbAPI.createCommunityReply(
        threadId,
        user.id,
        profile.username,
        profile.avatar_url,
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

  // Delete Thread (if owner)
  const handleDeleteThread = async (threadId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this thread?');
    if (!confirmDelete) return;

    try {
      const success = await dbAPI.deleteCommunityThread(user.id, threadId);
      if (success) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTitle.trim() || !challengeDescription.trim()) return;
    addCustomChallenge(
      challengeTitle.trim(),
      challengeDescription.trim(),
      challengeTargetCount,
      challengeType,
      challengeParam.trim()
    );
    // Reset form
    setChallengeTitle('');
    setChallengeDescription('');
    setChallengeTargetCount(3);
    setChallengeType('genre');
    setChallengeParam('');
  };

  // Parse review rating from content
  const parseThreadRatingAndContent = (content: string) => {
    const match = content.match(/^\[RATING:(\d+(\.\d+)?)\]/);
    if (match) {
      const rating = Number(match[1]);
      const cleanContent = content.replace(/^\[RATING:(\d+(\.\d+)?)\]/, '');
      return { rating, content: cleanContent };
    }
    return { rating: null, content };
  };

  return (
    <div className="py-8 pb-20">
      {/* Header */}
      <div className="px-6 lg:px-10 mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-2"
        >
          <Users size={32} className="text-primary" /> Cinephile Community Hub
        </motion.h1>
        <p className="text-muted-light">
          Share your film reviews, discuss cinematic themes, and complete movie challenges with real users.
        </p>

        {/* Active Members Bar */}
        {members.length > 0 && (
          <div className="w-full overflow-x-auto mt-6 pb-2 hide-scrollbar">
            <div className="flex items-center gap-4 min-w-max">
              <div className="text-xs font-semibold text-muted-light uppercase tracking-widest mr-2 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Active Members
                </div>
                <span className="text-[10px] opacity-60">Online Now</span>
              </div>
              {members.map((member) => (
                <div key={member.id} className="flex flex-col items-center gap-1.5 group cursor-pointer w-14">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    <img 
                      src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'} 
                      alt={member.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] text-muted-light group-hover:text-white truncate w-full text-center transition-colors">
                    {member.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 lg:px-10">
        {/* Navigation sub-tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-surface border border-border w-max mb-8">
          <button
            onClick={() => setActiveSubTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'reviews' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'
            }`}
          >
            <MessageSquare size={14} /> Critic Feed
          </button>
          <button
            onClick={() => setActiveSubTab('discussions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'discussions' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'
            }`}
          >
            <PlayCircle size={14} /> Discussions
          </button>
          <button
            onClick={() => setActiveSubTab('challenges')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'challenges' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-muted-light hover:text-white'
            }`}
          >
            <Trophy size={14} /> Challenges
          </button>
        </div>

        {/* Not Configured Alert */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-950/40 border border-amber-500/20 text-amber-300 text-xs leading-relaxed max-w-2xl">
            <strong>Database Offline Mode</strong>: To connect this community hub to a real backend, copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase connection credentials.
          </div>
        )}

        {/* Dynamic Panels */}
        <AnimatePresence mode="wait">
          {/* Critic Feed (Movie Reviews) */}
          {activeSubTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Reviews Feed Column */}
              <div className="lg:col-span-2 space-y-4">
                {loadingThreads && (
                  <div className="flex items-center justify-center py-12">
                    <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                  </div>
                )}

                {!loadingThreads && threads.filter((t) => t.movie_title).length === 0 && (
                  <div className="p-10 glass-light border border-white/5 rounded-2xl text-center text-muted-light text-xs">
                    No reviews published yet. Be the first to criticize a film!
                  </div>
                )}

                {!loadingThreads &&
                  threads
                    .filter((t) => t.movie_title)
                    .map((item) => {
                      const { rating, content } = parseThreadRatingAndContent(item.content);
                      const isOwner = user && user.id === item.user_id;

                      return (
                        <div key={item.id} className="p-5 glass-light rounded-2xl border border-white/5 space-y-4">
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
                                  className="text-muted hover:text-red-400 p-1 rounded transition-colors"
                                  title="Delete review"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-bold text-white mb-1">
                              Critique on <span className="text-primary italic">"{item.movie_title}"</span>
                            </h5>
                            {rating !== null && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <StarRating rating={rating} size={12} interactive={false} />
                              </div>
                            )}
                            <p className="text-xs md:text-sm text-gray-300 leading-relaxed italic">
                              "{content}"
                            </p>
                          </div>

                          {/* Expandable replies button */}
                          <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
                            <button
                              onClick={() => toggleThreadReplies(item.id)}
                              className="w-max flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors font-semibold"
                            >
                              <MessageSquare size={13} />
                              {expandedThreadId === item.id ? 'Collapse Discussion' : 'Join Discussion'}
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
                                      className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
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

              {/* Publish Critique Form Column */}
              <div className="space-y-4">
                <div className="p-5 glass-light rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-primary" /> Criticize a Film
                  </h3>

                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Movie / TV Show Title</label>
                        <input
                          type="text"
                          required
                          value={newReviewMovie}
                          onChange={(e) => setNewReviewMovie(e.target.value)}
                          placeholder="e.g. Inception"
                          className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Your Rating</label>
                        <StarRating rating={newReviewRating} onRate={setNewReviewRating} interactive />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Your Sarcastic Critique / Review</label>
                        <textarea
                          required
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                          placeholder="Post your thoughts. Be critical!"
                          className="w-full h-24 p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingThread}
                        className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
                      >
                        {submittingThread ? 'Posting...' : 'Post Review'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-light mb-4">You need an account to write and publish reviews.</p>
                      <span className="inline-block text-xs font-bold text-primary flex items-center gap-1 justify-center">
                        <LogIn size={14} /> Log in from the sidebar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Discussion Boards */}
          {activeSubTab === 'discussions' && (
            <motion.div
              key="discussions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Write Thread Accordion */}
              {user ? (
                <div>
                  <button
                    onClick={() => setShowThreadForm(!showThreadForm)}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-lg shadow-primary/20"
                  >
                    {showThreadForm ? 'Cancel Thread Creation' : 'Start New Discussion Thread'}
                  </button>

                  <AnimatePresence>
                    {showThreadForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleThreadSubmit}
                        className="mt-4 p-5 glass-light border border-white/5 rounded-2xl max-w-2xl space-y-4 overflow-hidden"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Thread Topic / Title</label>
                          <input
                            type="text"
                            required
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                            placeholder="e.g. Can we talk about the cinematography in Parasite?"
                            className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">Content</label>
                          <textarea
                            required
                            value={newThreadContent}
                            onChange={(e) => setNewThreadContent(e.target.value)}
                            placeholder="Start the discussion..."
                            className="w-full h-32 p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingThread}
                          className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all disabled:opacity-50"
                        >
                          {submittingThread ? 'Posting...' : 'Publish Thread'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-5 glass-light border border-white/5 rounded-2xl max-w-2xl flex items-center justify-between">
                  <span className="text-xs text-muted-light">Want to host a discussion topic? Log in to create a thread.</span>
                </div>
              )}

              {/* Thread Listings */}
              <div className="space-y-4 max-w-4xl">
                {loadingThreads && (
                  <div className="flex items-center justify-center py-12">
                    <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                  </div>
                )}

                {!loadingThreads && threads.filter((t) => !t.movie_title).length === 0 && (
                  <div className="p-10 glass-light border border-white/5 rounded-2xl text-center text-muted-light text-xs">
                    No general discussions yet. Start one above!
                  </div>
                )}

                {!loadingThreads &&
                  threads
                    .filter((t) => !t.movie_title)
                    .map((item) => {
                      const isOwner = user && user.id === item.user_id;
                      return (
                        <div key={item.id} className="p-5 glass-light rounded-2xl border border-white/5 space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                                alt={item.username}
                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-white">{item.username}</h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-light">{new Date(item.created_at).toLocaleDateString()}</span>
                              {isOwner && (
                                <button
                                  onClick={() => handleDeleteThread(item.id)}
                                  className="text-muted hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                                  title="Delete thread"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-line">{item.content}</p>
                          </div>

                          {/* Expandable replies button */}
                          <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
                            <button
                              onClick={() => toggleThreadReplies(item.id)}
                              className="w-max flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors font-semibold cursor-pointer"
                            >
                              <MessageSquare size={13} />
                              {expandedThreadId === item.id ? 'Hide Comments' : 'Show Comments'}
                              {repliesMap[item.id] && repliesMap[item.id].length > 0 && ` (${repliesMap[item.id].length})`}
                            </button>

                            {/* Replies Area */}
                            {expandedThreadId === item.id && (
                              <div className="pl-4 border-l-2 border-primary/20 space-y-3 mt-2">
                                {repliesMap[item.id]?.map((reply) => (
                                  <div key={reply.id} className="flex gap-2.5 items-start animate-fade-in">
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
                                      className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark cursor-pointer transition-all disabled:opacity-50"
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
            </motion.div>
          )}

          {/* Challenges */}
          {activeSubTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
            >
              {/* Challenge Form Column */}
              <div className="lg:col-span-1 p-5 glass-light rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-primary" /> Create Watch Challenge
                </h3>
                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-light uppercase tracking-wider mb-2">Challenge Title</label>
                    <input
                      type="text"
                      required
                      value={challengeTitle}
                      onChange={(e) => setChallengeTitle(e.target.value)}
                      placeholder="e.g. Horror Fanatic"
                      className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-light uppercase tracking-wider mb-2">Description</label>
                    <input
                      type="text"
                      required
                      value={challengeDescription}
                      onChange={(e) => setChallengeDescription(e.target.value)}
                      placeholder="e.g. Watch 5 Horror movies"
                      className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-light uppercase tracking-wider mb-2">Target Count</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={challengeTargetCount}
                        onChange={(e) => setChallengeTargetCount(Number(e.target.value))}
                        className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-light uppercase tracking-wider mb-2">Condition Type</label>
                      <select
                        value={challengeType}
                        onChange={(e) => setChallengeType(e.target.value as any)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
                      >
                        <option value="genre">Genre</option>
                        <option value="director">Director</option>
                        <option value="language">Language</option>
                        <option value="count">Total Count</option>
                      </select>
                    </div>
                  </div>
                  {challengeType !== 'count' && challengeType !== 'director' && (
                    <div>
                      <label className="block text-[10px] font-bold text-muted-light uppercase tracking-wider mb-2">
                        {challengeType === 'genre' ? 'Genre Name (e.g. Science Fiction)' : 'Language Name (e.g. French)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={challengeParam}
                        onChange={(e) => setChallengeParam(e.target.value)}
                        placeholder={challengeType === 'genre' ? 'Horror, Comedy, Action...' : 'English, French, Japanese...'}
                        className="w-full p-2.5 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  )}

                  {challengeType === 'director' && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-[10px] text-primary leading-relaxed">
                      💡 <strong>Director Challenge</strong> automatically tracks the director with the most watch counts in your library dynamically. No parameter input is required.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  >
                    Activate Challenge
                  </button>
                </form>
              </div>

              {/* Challenge Listing Column */}
              <div className="lg:col-span-2 space-y-4">
                {challenges.map((c) => {
                  const percent = Math.min(Math.round((c.currentCount / c.targetCount) * 100), 100);
                  const isCustom = !['1', '2', '3', '4'].includes(c.id);

                  return (
                    <div
                      key={c.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        c.completed ? 'bg-success/5 border-success/30 shadow-[0_0_15px_rgba(52,211,153,0.05)]' : 'glass-light border-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                            {c.completed ? (
                              <Trophy size={16} className="text-success fill-success" />
                            ) : (
                              <Award size={16} className="text-primary" />
                            )}
                            {c.title}
                            {isCustom && (
                              <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                Custom
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-light mt-1">{c.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black ${c.completed ? 'text-success' : 'text-primary'}`}>
                            {c.completed ? 'COMPLETED' : `${c.currentCount}/${c.targetCount}`}
                          </span>
                          {isCustom && (
                            <button
                              onClick={() => deleteChallenge(c.id)}
                              className="text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                              title="Delete challenge"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-5">
                        <div className="flex justify-between text-[10px] text-muted-light font-bold mb-1.5 uppercase">
                          <span>Progress</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${c.completed ? 'bg-success' : 'bg-primary'}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
