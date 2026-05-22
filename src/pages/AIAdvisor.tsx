import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Send, Sparkles, Trash2, Brain, AlertCircle } from 'lucide-react';
import { askGemini } from '../lib/gemini';

export function AIAdvisor() {
  const { movies, aiChatHistory, addChatMessage, clearChatHistory, geminiApiKey } = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiChatHistory, isTyping]);

  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched'), [movies]);

  // Compute profile statistics for rule-based responses
  const profileStats = useMemo(() => {
    if (watchedMovies.length === 0) return null;

    const genres: Record<string, number> = {};
    const directors: Record<string, number> = {};
    const languages: Record<string, number> = {};
    let totalRating = 0;
    let ratedCount = 0;

    watchedMovies.forEach(m => {
      m.genres.forEach(g => { genres[g] = (genres[g] || 0) + 1; });
      m.directors.forEach(d => { directors[d] = (directors[d] || 0) + 1; });
      m.spoken_languages.forEach(l => { languages[l] = (languages[l] || 0) + 1; });
      if (m.user_rating) {
        totalRating += m.user_rating;
        ratedCount++;
      }
    });

    const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const topDirector = Object.entries(directors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'English';
    const averageRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 'None';

    return {
      total: watchedMovies.length,
      topGenre,
      topDirector,
      topLanguage,
      avgRating: averageRating,
    };
  }, [watchedMovies]);

  // Taste critiquing function
  const generateAIResponse = (userText: string): string => {
    const text = userText.toLowerCase();

    if (watchedMovies.length === 0) {
      return "I'd love to analyze your taste, but your watched history is completely blank! Mark some titles as Watched, add ratings and critiques, and then come back to get a deep breakdown of your movie archetype.";
    }

    const { total, topGenre, topDirector, avgRating, topLanguage } = profileStats!;

    // Roast / Taste Bias request
    if (text.includes('roast') || text.includes('critique') || text.includes('bias') || text.includes('taste')) {
      let roast = '';
      if (Number(avgRating) > 4.4) {
        roast += `First of all, your average rating is ${avgRating}★. You rating everything a masterpiece! Are you a cinephile or a movie cheerleader? Grow some teeth! `;
      } else if (Number(avgRating) < 2.5) {
        roast += `Your average rating is ${avgRating}★. You seem to hate everything you watch. Who hurt you? Let yourself enjoy a film once in a while! `;
      }

      if (topGenre === 'Action' || topGenre === 'Adventure') {
        roast += `Your absolute favorite genre is ${topGenre}. Do you get nervous if characters sit in a room and speak for more than 30 seconds without a car chase or explosion? You should explore some slow-burn dramas.`;
      } else if (topGenre === 'Horror') {
        roast += `You love Horror. Staring into the abyss much? Your heart rate must be constantly at 120bpm. Maybe try a comedy or a light romance to cleanse your eyes before the ghosts catch you.`;
      } else if (topGenre === 'Science Fiction') {
        roast += `You lean heavily on Sci-Fi. Dreaming of space because Earth is too boring? It's okay, we all want to leave. Try checking out some historical dramas to ground yourself in reality.`;
      } else if (topGenre === 'Drama') {
        roast += `Drama connoisseur, eh? You love witnessing emotional wreckage. Your diary must be filled with tears. How about an upbeat animated flick or a stupid comedy for a change?`;
      } else {
        roast += `You've watched ${total} movies with a heavy leaning towards ${topGenre}. Honestly, it's a solid start, but you're sticking to your comfort zone. Break out!`;
      }

      if (topDirector !== 'Unknown' && topDirector !== '—') {
        roast += ` Also, watching so much ${topDirector} indicates a director-fixation. Explore independent filmmakers!`;
      }

      return roast;
    }

    // Recommendation / suggest request
    if (text.includes('recommend') || text.includes('suggest') || text.includes('watch') || text.includes('movie')) {
      // Foreign film request
      if (text.includes('foreign') || text.includes('gem') || text.includes('world') || text.includes('language')) {
        return `Since you've watched mostly ${topLanguage} cinema, I recommend diving into foreign masterpieces. Check out:
1. 🇰🇷 *Parasite (2019)* - Directed by Bong Joon Ho (Thriller/Social Drama)
2. 🇯🇵 *Spirited Away (2001)* - Directed by Hayao Miyazaki (Fantasy/Animation)
3. 🇫🇷 *Portrait of a Lady on Fire (2019)* - Directed by Céline Sciamma (Romance/Drama)
4. 🇮🇹 *Cinema Paradiso (1988)* - Directed by Giuseppe Tornatore (Drama)
These will expand your cultural horizons beyond Hollywood!`;
      }

      // Classic/Indie request
      if (text.includes('underrated') || text.includes('obscure') || text.includes('indie')) {
        return `Here are 4 highly praised but slightly less mainstream cinema recommendations for a budding cinephile:
1. *Coherence (2013)* - An ultra-low budget sci-fi mind-bender set during a dinner party.
2. *The Fall (2006)* - Visually stunning masterpiece directed by Tarsem Singh.
3. *Memento (2000)* - Christopher Nolan's reverse-chronological crime thriller.
4. *Incendies (2010)* - A jaw-dropping mystery drama directed by Denis Villeneuve.
Add them to your watchlist and let me know your ratings!`;
      }

      // Default recommendations based on genre
      const recommendationsMap: Record<string, string[]> = {
        'Action': ['John Wick', 'Mad Max: Fury Road', 'The Dark Knight', 'Die Hard'],
        'Science Fiction': ['Interstellar', 'Blade Runner 2049', 'Arrival', 'Dune'],
        'Horror': ['Hereditary', 'The Conjuring', 'Get Out', 'Alien'],
        'Drama': ['The Shawshank Redemption', 'Whiplash', 'Fight Club', 'Forrest Gump'],
        'Comedy': ['Superbad', 'The Grand Budapest Hotel', 'Booksmart', 'Knives Out'],
      };

      const suggestions = recommendationsMap[topGenre] || ['Pulp Fiction', 'Inception', 'The Matrix', 'Parasite'];

      return `Based on your favorite genre (**${topGenre}**), here are 4 personalized recommendations you should add to your Watchlist:
1. 🎬 *${suggestions[0]}* (High energy, top recommendation)
2. 🎬 *${suggestions[1]}* (Highly critically acclaimed)
3. 🎬 *${suggestions[2]}* (A absolute fan favorite)
4. 🎬 *${suggestions[3]}* (Great cinematography and pacing)

Ask me for obscure recommendations if you want to dig deeper!`;
    }

    // Help or General information
    if (text.includes('help') || text.includes('hello') || text.includes('hi ') || text.includes('hey')) {
      return `Welcome! I can perform the following analyses:
- ⚡ **"Roast My Taste"**: I'll look at your average rating, ratings distribution, and main genres to critique your movie behavior.
- 🌎 **"Recommend a Foreign Gem"**: Hand-picked international movies to expand your language palette.
- 🎬 **"Suggest an Underrated Masterpiece"**: Cult classics and mind-bending indie films.
- 📈 **"Summarize My Watch Bias"**: Check your distribution metrics.

Go ahead, type an instruction or click one of the quick chips below!`;
    }

    // Default chat fallback
    return `Interesting point. Looking at your profile, you've recorded ${total} viewings in your diary. Your taste is heavily shaped by ${topGenre} and films in ${topLanguage}. 

What specific director, decade, or film style should we analyze next? (Try asking me to "Roast My Taste" or "Recommend a Foreign Gem")`;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    addChatMessage('user', userText);
    setInput('');
    setIsTyping(true);

    if (geminiApiKey) {
      try {
        const historyMapped = aiChatHistory.map(h => ({ sender: h.sender, text: h.text }));
        const response = await askGemini(userText, geminiApiKey, historyMapped, {
          activePage: 'AI Advisor Chat',
          userProfile: profileStats ? {
            watchedMoviesCount: profileStats.total,
            topGenre: profileStats.topGenre,
            topDirector: profileStats.topDirector,
            avgRating: profileStats.avgRating,
            topLanguage: profileStats.topLanguage
          } : undefined
        });
        addChatMessage('ai', response);
      } catch (err: any) {
        console.error(err);
        addChatMessage('ai', `⚠️ Error connecting to Gemini API: ${err.message || err}. Please ensure your Gemini API key is valid.`);
      } finally {
        setIsTyping(false);
      }
    } else {
      setTimeout(() => {
        const response = generateAIResponse(userText);
        addChatMessage('ai', response);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleChipClick = async (text: string) => {
    if (isTyping) return;
    addChatMessage('user', text);
    setIsTyping(true);

    if (geminiApiKey) {
      try {
        const historyMapped = aiChatHistory.map(h => ({ sender: h.sender, text: h.text }));
        const response = await askGemini(text, geminiApiKey, historyMapped, {
          activePage: 'AI Advisor Chat',
          userProfile: profileStats ? {
            watchedMoviesCount: profileStats.total,
            topGenre: profileStats.topGenre,
            topDirector: profileStats.topDirector,
            avgRating: profileStats.avgRating,
            topLanguage: profileStats.topLanguage
          } : undefined
        });
        addChatMessage('ai', response);
      } catch (err: any) {
        console.error(err);
        addChatMessage('ai', `⚠️ Error connecting to Gemini API: ${err.message || err}. Please ensure your Gemini API key is valid.`);
      } finally {
        setIsTyping(false);
      }
    } else {
      setTimeout(() => {
        const response = generateAIResponse(text);
        addChatMessage('ai', response);
        setIsTyping(false);
      }, 1000);
    }
  };

  const quickPrompts = [
    { label: '🔥 Roast My Taste', prompt: 'Roast my movie taste and rating bias.' },
    { label: '🎬 Suggest an Underrated Masterpiece', prompt: 'Suggest an underrated/obscure movie recommendation.' },
    { label: '🌍 Recommend a Foreign Gem', prompt: 'Recommend a foreign gem or world language cinema.' },
    { label: '📈 Summarize My Watch Bias', prompt: 'Summarize my watch bias based on genres.' },
  ];

  return (
    <div className="py-8 pb-20 px-6 lg:px-10 flex flex-col h-[calc(100vh-60px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-2">
            <Sparkles className="text-primary fill-primary animate-pulse" size={28} /> AI Cine-Advisor
          </h1>
          <p className="text-muted-light text-sm">Taste critique, roasts, and custom recommendations powered by your watch diary.</p>
        </div>
        <button
          onClick={clearChatHistory}
          className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Clear Chat Logs"
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 mb-4">
        {/* Chat Bubbles Container */}
        <div className="flex-1 glass-light rounded-2xl border border-white/5 p-4 md:p-6 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 carousel-scroll">
            {!geminiApiKey && (
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-xs text-yellow-400 leading-relaxed mb-2">
                ⚠️ **Local Fallback Mode active.** To connect the Cine-Advisor to a real AI that can answer anything, configure **VITE_GEMINI_API_KEY** in your `.env` file, or open the settings (⚙️ icon) in the floating bottom-right chat bubble.
              </div>
            )}
            <AnimatePresence initial={false}>
              {aiChatHistory.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                      isAI
                        ? 'bg-surface border border-white/5 text-gray-200 rounded-tl-none'
                        : 'bg-primary text-white rounded-tr-none shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                    }`}>
                      {/* Avatar header for AI */}
                      {isAI && (
                        <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider mb-1.5">
                          <Brain size={12} /> Advisor AI
                        </div>
                      )}
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-surface border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt chips inside chat area */}
          <div className="mt-4 flex flex-wrap gap-2 flex-shrink-0">
            {quickPrompts.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.prompt)}
                disabled={isTyping}
                className="px-3 py-1.5 rounded-xl text-xs bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-primary/45 disabled:opacity-50 transition-all font-semibold"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Status Info */}
        <div className="w-full lg:w-72 glass-light rounded-2xl border border-white/5 p-5 flex flex-col justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <Brain size={16} className="text-primary" /> Taste Analytics
            </h3>
            {watchedMovies.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Movies Analyzed</p>
                  <p className="text-2xl font-black text-white">{profileStats?.total}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Top Genre Leaning</p>
                  <p className="text-base font-bold text-primary">{profileStats?.topGenre}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Average Score</p>
                  <p className="text-base font-bold text-gold">{profileStats?.avgRating} ★</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Language Bias</p>
                  <p className="text-sm font-medium text-gray-300">{profileStats?.topLanguage}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-light">
                <AlertCircle size={24} className="mx-auto mb-2 text-muted" />
                <p className="text-xs">No watched films recorded. Log some movie details to populate the AI analysis metrics.</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <p className="text-xs text-primary font-bold mb-1">Cinephile Tip</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">The Advisor AI is fully customized to critique your movie behavior. Rate movies harsh or high, the AI dynamically adapts.</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AI Advisor for recommendations, or click a chip above..."
          className="flex-1 py-3 px-4 text-sm bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          className="px-5 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
