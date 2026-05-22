import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Settings, Key, HelpCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { tmdbApi } from '../lib/tmdb';
import { askGemini } from '../lib/gemini';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export function AIChatbot() {
  const location = useLocation();
  const { apiKey, geminiApiKey, setGeminiApiKey, clearGeminiApiKey, movies } = useStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your contextual AI Buddy. I know what page you're looking at and can answer any questions about movies, directors, cast members, or accolades!",
      timestamp: new Date().toISOString(),
    }
  ]);
  
  const [mediaDetails, setMediaDetails] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize API Key input state
  useEffect(() => {
    if (geminiApiKey) {
      setApiKeyInput(geminiApiKey);
    } else {
      setApiKeyInput('');
    }
  }, [geminiApiKey]);

  // Determine Page Context
  const getPageContextLabel = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/movies') return 'Movies Explorer';
    if (path === '/series') return 'Series Explorer';
    if (path === '/anime') return 'Anime Hub';
    if (path === '/my-list') return 'My Library & Diary';
    if (path === '/stats') return 'Watching Analytics';
    if (path === '/community') return 'Community Hub';
    if (path === '/ai-advisor') return 'AI Advisor Page';
    if (path.startsWith('/details/')) {
      return mediaDetails ? `Details: ${mediaDetails.title}` : 'Details Page';
    }
    return 'Binge Buddy';
  };

  // Fetch media details if on details page
  useEffect(() => {
    const match = location.pathname.match(/^\/details\/(movie|tv)\/(\d+)/);
    if (match && apiKey) {
      const mediaType = match[1] as 'movie' | 'tv';
      const id = parseInt(match[2], 10);
      tmdbApi.getDetails(id, mediaType, apiKey)
        .then((details) => {
          setMediaDetails(details);
        })
        .catch((err) => {
          console.error('Error fetching details for chatbot context:', err);
          setMediaDetails(null);
        });
    } else {
      setMediaDetails(null);
    }
  }, [location.pathname, apiKey]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const watchedMovies = movies.filter((m) => m.status === 'watched');

  // Compute profile statistics
  const profileStats = (() => {
    if (watchedMovies.length === 0) return null;
    const genres: Record<string, number> = {};
    const directors: Record<string, number> = {};
    const languages: Record<string, number> = {};
    let totalRating = 0;
    let ratedCount = 0;

    watchedMovies.forEach((m) => {
      m.genres.forEach((g) => { genres[g] = (genres[g] || 0) + 1; });
      if (m.directors) {
        m.directors.forEach((d) => { directors[d] = (directors[d] || 0) + 1; });
      }
      if (m.spoken_languages) {
        m.spoken_languages.forEach((l) => { languages[l] = (languages[l] || 0) + 1; });
      }
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
  })();

  // Simulated fallback response
  const generateSimulatedResponse = (text: string): string => {
    const query = text.toLowerCase();
    
    // Awards queries
    if (query.includes('oscar') || query.includes('award') || query.includes('win') || query.includes('won')) {
      if (query.includes('dicaprio') || query.includes('decaprio')) {
        return `According to our records, **Leonardo DiCaprio** has won **1 Oscar (Academy Award)**:
- **2016**: Best Actor for *The Revenant*.
He also has won **3 Golden Globes** (for *The Aviator*, *The Wolf of Wall Street*, and *The Revenant*) and **1 BAFTA** for *The Revenant*.`;
      }
      if (query.includes('nolan')) {
        return `**Christopher Nolan** has won **2 Oscars**:
- **2024**: Best Director and Best Picture for *Oppenheimer*.
He also won the Golden Globe and BAFTA in 2024 for directing *Oppenheimer*.`;
      }
      if (query.includes('stone')) {
        return `**Emma Stone** has won **2 Oscars (Best Actress)**:
- **2017**: for *La La Land*.
- **2024**: for *Poor Things*.`;
      }
      if (query.includes('oppenheimer')) {
        return `*Oppenheimer* won **7 Oscars** at the 2024 Academy Awards, including Best Picture, Best Director (Christopher Nolan), Best Actor (Cillian Murphy), and Best Supporting Actor (Robert Downey Jr.).`;
      }
      if (query.includes('parasite')) {
        return `*Parasite* made history at the 2020 Oscars by winning **4 Academy Awards**, including Best Picture (the first non-English language film to do so), Best Director (Bong Joon Ho), Best Original Screenplay, and Best International Feature Film. It also won the Palme d'Or at Cannes.`;
      }
    }

    // Detail context queries
    if (location.pathname.startsWith('/details/') && mediaDetails) {
      if (query.includes('director') || query.includes('crew') || query.includes('who directed')) {
        return `The director of **${mediaDetails.title}** is **${mediaDetails.directors ? mediaDetails.directors.join(', ') : 'unknown'}**.`;
      }
      if (query.includes('cast') || query.includes('actor') || query.includes('who is in')) {
        return `Here are some of the main cast members of **${mediaDetails.title}**:
${mediaDetails.cast ? mediaDetails.cast.slice(0, 5).map((c: any) => `- **${c.name}** as *${c.character}*`).join('\n') : 'Cast details unavailable.'}`;
      }
      if (query.includes('overview') || query.includes('about') || query.includes('story')) {
        return `Here is the overview for **${mediaDetails.title}**:
"${mediaDetails.overview}"`;
      }
    }

    // General queries
    return `I see you are asking about: "${text}". 
    
To get a full, intelligent answer using Google's **Gemini 2.5 Flash** model, please enter your Gemini API Key in the settings (click the ⚙️ icon at the top of this window). 

*Currently running in Local Fallback mode.*`;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;
    const userText = textToSend.trim();
    
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    if (geminiApiKey) {
      try {
        const historyMapped = messages.map((m) => ({ sender: m.sender, text: m.text }));
        const response = await askGemini(userText, geminiApiKey, historyMapped, {
          activePage: getPageContextLabel(),
          mediaDetails: mediaDetails || undefined,
          userProfile: profileStats ? {
            watchedMoviesCount: profileStats.total,
            topGenre: profileStats.topGenre,
            topDirector: profileStats.topDirector,
            avgRating: profileStats.avgRating,
            topLanguage: profileStats.topLanguage
          } : undefined
        });
        
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            sender: 'ai',
            text: response,
            timestamp: new Date().toISOString(),
          }
        ]);
      } catch (err: any) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            sender: 'ai',
            text: `⚠️ **Gemini API Error:** ${err.message || err}. Please verify your API Key in settings.`,
            timestamp: new Date().toISOString(),
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Local fallback
      setTimeout(() => {
        const response = generateSimulatedResponse(userText);
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            sender: 'ai',
            text: response,
            timestamp: new Date().toISOString(),
          }
        ]);
        setIsTyping(false);
      }, 800);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setGeminiApiKey(apiKeyInput.trim());
      setShowSettings(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'ai',
          text: "✅ **Gemini API Key connected successfully!** You are now talking to a real Gemini 2.5 Flash model.",
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  };

  const handleClearApiKey = () => {
    clearGeminiApiKey();
    setApiKeyInput('');
    setShowSettings(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'ai',
        text: "🔌 **Gemini API Key disconnected.** Switched back to local static lookup mode.",
        timestamp: new Date().toISOString(),
      }
    ]);
  };

  // Get dynamic suggestions based on context
  const getSuggestions = () => {
    if (location.pathname.startsWith('/details/') && mediaDetails) {
      return [
        { label: '🎬 Who directed this?', text: `Who is the director of ${mediaDetails.title}?` },
        { label: '👥 Show cast members', text: `Tell me about the cast of ${mediaDetails.title}.` },
        { label: '🏆 Awards / Prizes info', text: `Did ${mediaDetails.title} win any Oscars, Cannes, or other awards?` }
      ];
    }
    return [
      { label: '🏆 Oscars Leo Won', text: 'How many Oscars did Leonardo DiCaprio win?' },
      { label: '🎥 Nolan Oscars', text: 'What awards did Christopher Nolan win?' },
      { label: '🔥 Roast my taste', text: 'Roast my movie taste and rating bias.' },
    ];
  };

  // Format response text with simple formatting (markdown-ish bold and bullet points)
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Process bold formatting (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      let parts = [];
      let lastIdx = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          parts.push(line.substring(lastIdx, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < line.length) {
        parts.push(line.substring(lastIdx));
      }

      // Check if it's a bullet point
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isBullet) {
        const bulletText = line.trim().substring(2);
        // Process bold in bullet
        let bulletParts = [];
        let bLastIdx = 0;
        let bMatch;
        while ((bMatch = boldRegex.exec(bulletText)) !== null) {
          if (bMatch.index > bLastIdx) {
            bulletParts.push(bulletText.substring(bLastIdx, bMatch.index));
          }
          bulletParts.push(<strong key={bMatch.index} className="text-white font-bold">{bMatch[1]}</strong>);
          bLastIdx = boldRegex.lastIndex;
        }
        if (bLastIdx < bulletText.length) {
          bulletParts.push(bulletText.substring(bLastIdx));
        }
        return (
          <li key={idx} className="ml-4 list-disc text-white/90 text-[11px] leading-relaxed my-0.5">
            {bulletParts.length > 0 ? bulletParts : bulletText}
          </li>
        );
      }

      return (
        <p key={idx} className="text-[11px] text-white/90 leading-relaxed my-1 min-h-[1em]">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white flex items-center justify-center shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.6)] hover:scale-105 transition-all duration-300 z-50 group border border-white/20 cursor-pointer"
        title="Binge Buddy AI Assistant"
      >
        {isOpen ? (
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <MessageSquare size={24} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping border border-primary" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-primary" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 w-96 h-[500px] rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Binge Buddy AI
                  </h3>
                  <p className="text-[10px] text-muted-light font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Context: <span className="text-primary truncate max-w-[130px]">{getPageContextLabel()}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg text-muted hover:text-white transition-colors hover:bg-white/5 ${showSettings ? 'text-primary bg-primary/10' : ''}`}
                  title="Gemini API Key Settings"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-white transition-colors hover:bg-white/5"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative min-h-0 flex flex-col bg-black/20">
              {showSettings ? (
                /* Settings Panel */
                <div className="absolute inset-0 bg-[#0c0c14]/95 z-20 p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs border-b border-white/10 pb-2">
                      <Key size={14} /> Gemini API Configuration
                    </div>
                    <p className="text-[10px] text-muted-light leading-relaxed">
                      Connect your Binge Buddy to Google's **Gemini 2.5 Flash** to get high-quality movie advisor responses contextually. You can paste it here or configure **VITE_GEMINI_API_KEY** in your `.env` file.
                    </p>
                    
                    <div className="space-y-2">
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-muted-light">
                        Gemini API Key
                      </label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2">
                      <HelpCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-[9px] text-muted-light leading-relaxed">
                        Don't have an API key? You can get a free one from Google AI Studio. Your key is stored only on this browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                    {geminiApiKey && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-3 py-1.5 border border-red-500/20 text-red-400 text-[10px] font-semibold rounded-lg hover:bg-red-500/10 cursor-pointer"
                      >
                        Disconnect Key
                      </button>
                    )}
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim()}
                      className="px-4 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
                    >
                      Connect Key
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                {!geminiApiKey && (
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[10px] text-yellow-400 leading-relaxed">
                    ⚠️ **Local Fallback Mode active.** Enter your Gemini API Key in the settings (⚙️ icon) to connect Binge Buddy to real AI!
                  </div>
                )}
                
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs border ${
                          isUser
                            ? 'bg-primary/20 border-primary/30 text-white rounded-tr-sm shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                            : 'bg-white/5 border-white/5 text-white/90 rounded-tl-sm'
                        }`}
                      >
                        {renderMessageText(msg.text)}
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Chips */}
              {!isTyping && (
                <div className="px-4 py-2 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none border-t border-white/5 bg-black/10">
                  {getSuggestions().map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug.text)}
                      className="px-2.5 py-1 text-[10px] font-medium text-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Binge Buddy AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  disabled={isTyping}
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary transition-colors cursor-pointer flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
