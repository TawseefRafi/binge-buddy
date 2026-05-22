import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Star, Film, Loader2 } from 'lucide-react';
import { tmdbApi, IMG } from '../lib/tmdb';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { getPersonAwards } from '../lib/awardsData';

interface PersonDrawerProps {
  personId: number | null;
  onClose: () => void;
}

export function PersonDrawer({ personId, onClose }: PersonDrawerProps) {
  const { apiKey } = useStore();
  const navigate = useNavigate();
  const [person, setPerson] = useState<any | null>(null);
  const [credits, setCredits] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const personAwards = person ? getPersonAwards(person.id) : [];

  useEffect(() => {
    if (!personId || !apiKey) {
      setPerson(null);
      setCredits(null);
      return;
    }

    setLoading(true);
    setError('');

    Promise.all([
      tmdbApi.getPersonDetails(personId, apiKey),
      tmdbApi.getPersonCredits(personId, apiKey),
    ])
      .then(([personDetails, personCredits]) => {
        setPerson(personDetails);
        setCredits(personCredits);
      })
      .catch((err) => {
        console.error('Error fetching person info:', err);
        setError('Failed to load person profile.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [personId, apiKey]);

  // Combine and sort credits into past and upcoming
  const getProjects = () => {
    if (!credits) return { past: [], upcoming: [] };

    // Merge acting credits (cast) and directing/crew credits (crew)
    const acting = (credits.cast || []).map((item: any) => ({
      ...item,
      displayRole: item.character ? `as ${item.character}` : 'Actor',
    }));

    const directing = (credits.crew || [])
      .filter((item: any) => item.job === 'Director' || item.job === 'Creator')
      .map((item: any) => ({
        ...item,
        displayRole: item.job,
      }));

    // Combine all
    const allCredits = [...acting, ...directing];

    // Remove duplicates by ID and media_type
    const seen = new Set<string>();
    const uniqueCredits = allCredits.filter((item) => {
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const currentYear = 2026;
    const past: any[] = [];
    const upcoming: any[] = [];

    uniqueCredits.forEach((item) => {
      const releaseDate = item.release_date || item.first_air_date;
      const title = item.title || item.name;

      if (!title) return; // Skip items without titles

      if (!releaseDate) {
        // No release date usually means in-production or planned (upcoming)
        upcoming.push(item);
      } else {
        const year = new Date(releaseDate).getFullYear();
        if (year > currentYear) {
          upcoming.push(item);
        } else {
          past.push(item);
        }
      }
    });

    // Sort past: descending by release date (newest first)
    past.sort((a, b) => {
      const dateA = a.release_date || a.first_air_date || '';
      const dateB = b.release_date || b.first_air_date || '';
      return dateB.localeCompare(dateA);
    });

    // Sort upcoming: ascending by release date (closer first, undated at the end)
    upcoming.sort((a, b) => {
      const dateA = a.release_date || a.first_air_date;
      const dateB = b.release_date || b.first_air_date;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });

    return { past, upcoming };
  };

  const { past, upcoming } = getProjects();

  const handleProjectClick = (item: any) => {
    navigate(`/details/${item.media_type}/${item.id}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {personId && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-background/95 border-l border-border glass-panel z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header toolbar */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-black/20">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                👤 Creator Profile
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={36} className="text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <button onClick={onClose} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white">Close Drawer</button>
              </div>
            ) : person ? (
              <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                {/* Person Header card */}
                <div className="flex gap-4 items-start">
                  {person.profile_path ? (
                    <img
                      src={IMG.profile(person.profile_path, 'h632')!}
                      alt={person.name}
                      className="w-24 h-32 object-cover rounded-xl shadow-lg border border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-32 rounded-xl bg-surface-light border border-border flex items-center justify-center text-muted font-bold text-2xl">
                      {person.name[0]}
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                      {person.name}
                    </h2>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {person.known_for_department || 'Artist'}
                    </p>

                    <div className="space-y-1 text-xs text-muted-light">
                      {person.birthday && (
                        <p className="flex items-center gap-1.5">
                          <Calendar size={12} /> Born {new Date(person.birthday).toLocaleDateString()}
                          {person.deathday && ` - Died ${new Date(person.deathday).toLocaleDateString()}`}
                        </p>
                      )}
                      {person.place_of_birth && (
                        <p className="flex items-center gap-1.5">
                          <MapPin size={12} /> {person.place_of_birth}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {person.biography && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-1">
                      Biography
                    </h4>
                    <p className="text-xs md:text-sm leading-relaxed text-gray-300 whitespace-pre-line max-h-40 overflow-y-auto p-3 bg-black/20 rounded-xl border border-white/5 custom-scroll">
                      {person.biography}
                    </p>
                  </div>
                )}

                {/* Awards & Accolades */}
                {personAwards.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-1">
                      🏆 Awards & Accolades
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {personAwards.map((award, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-xl text-[11px] font-semibold text-gold shadow-[0_0_10px_rgba(234,179,8,0.05)] cursor-default hover:bg-gold/15 transition-all"
                        >
                          <span>🏅</span>
                          <span>{award.award} – {award.category} ({award.year})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Projects */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
                    <span>Upcoming Projects</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">
                      {upcoming.length}
                    </span>
                  </h4>
                  {upcoming.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-3 carousel-scroll">
                      {upcoming.map((item) => (
                        <div
                          key={`${item.media_type}-${item.id}`}
                          onClick={() => handleProjectClick(item)}
                          className="flex flex-col w-20 flex-shrink-0 cursor-pointer group"
                        >
                          {item.poster_path ? (
                            <img
                              src={IMG.poster(item.poster_path, 'w92')!}
                              alt=""
                              className="w-20 h-28 object-cover rounded-lg group-hover:scale-105 group-hover:border-primary/50 border border-transparent transition-all shadow-md"
                            />
                          ) : (
                            <div className="w-20 h-28 rounded-lg bg-surface-light border border-border flex items-center justify-center text-[10px] text-muted text-center p-1.5">
                              {item.title || item.name}
                            </div>
                          )}
                          <span className="text-[10px] font-semibold text-white truncate mt-1 w-full text-center group-hover:text-primary transition-colors">
                            {item.title || item.name}
                          </span>
                          <span className="text-[8px] text-muted truncate w-full text-center">
                            {item.displayRole}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-light italic">No upcoming projects listed on TMDB.</p>
                  )}
                </div>

                {/* Past Projects */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
                    <span>Filmography</span>
                    <span className="text-[10px] bg-zinc-800 text-muted-light px-1.5 py-0.5 rounded font-mono">
                      {past.length}
                    </span>
                  </h4>
                  {past.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {past.slice(0, 15).map((item) => {
                        const year = (item.release_date || item.first_air_date)?.substring(0, 4);
                        return (
                          <div
                            key={`${item.media_type}-${item.id}`}
                            onClick={() => handleProjectClick(item)}
                            className="p-2 bg-black/20 hover:bg-white/5 border border-white/5 rounded-xl flex gap-2 items-center cursor-pointer group transition-all"
                          >
                            {item.poster_path ? (
                              <img
                                src={IMG.poster(item.poster_path, 'w92')!}
                                alt=""
                                className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded-md bg-surface-light flex items-center justify-center text-[8px] text-muted flex-shrink-0">
                                <Film size={12} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[10px] font-bold text-white truncate group-hover:text-primary transition-colors">
                                {item.title || item.name}
                              </h5>
                              <p className="text-[8px] text-muted truncate">{item.displayRole}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[8px] text-muted-light font-bold">
                                {year && <span>{year}</span>}
                                {item.vote_average > 0 && (
                                  <span className="flex items-center text-gold gap-0.5">
                                    <Star size={8} className="fill-gold" /> {item.vote_average.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-light italic">No past credits listed.</p>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
