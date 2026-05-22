import { useRef, useMemo } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore } from '../store/useStore';
import { IMG } from '../lib/tmdb';

export function CineWrapped() {
  const { movies, topFavorites } = useStore();
  const printRef = useRef<HTMLDivElement>(null);
  const watchedMovies = movies.filter(m => m.status === 'watched');

  const stats = useMemo(() => {
    let totalRuntime = 0;
    const genresCount: Record<string, number> = {};

    watchedMovies.forEach(m => {
      totalRuntime += m.runtime || 0;
      m.genres.forEach(g => { genresCount[g] = (genresCount[g] || 0) + 1; });
    });

    const days = Math.floor(totalRuntime / (24 * 60));
    const hours = Math.floor((totalRuntime % (24 * 60)) / 60);
    const minutes = totalRuntime % 60;
    const topGenre = Object.entries(genresCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    let archetype = 'Casual Viewer';
    if (topGenre === 'Science Fiction') archetype = 'Sci-Fi Voyager';
    else if (topGenre === 'Horror') archetype = 'Thrill Seeker';
    else if (topGenre === 'Romance') archetype = 'Hopeless Romantic';
    else if (topGenre === 'Action') archetype = 'Adrenaline Junkie';
    else if (topGenre === 'Drama') archetype = 'Drama Connoisseur';

    return { days, hours, minutes, topGenre, archetype, totalWatched: watchedMovies.length };
  }, [watchedMovies]);

  const handleExport = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#0a0a0f', useCORS: true });
      const link = document.createElement('a');
      link.download = 'binge-buddy-wrapped.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error('Export failed', err); }
  };

  if (watchedMovies.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">🎁 CineWrapped Export</h3>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all bg-primary rounded-xl hover:bg-primary-dark glow-border">
          <Download size={16} /> Export Image
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div ref={printRef} className="w-[800px] h-[400px] relative rounded-3xl overflow-hidden p-8 flex border border-white/10 shrink-0" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/25 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/15 blur-[80px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3" />

          <div className="flex flex-col justify-between w-1/2 pr-8 border-r border-white/10 z-10">
            <div>
              <h2 className="text-3xl font-black text-gradient">Binge Buddy</h2>
              <p className="text-muted-light font-medium text-sm">Your Year In Cinema</p>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Archetype</p>
                <p className="text-2xl font-black text-white">{stats.archetype}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Titles Watched</p>
                  <p className="text-xl font-bold text-white">{stats.totalWatched}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Top Genre</p>
                  <p className="text-xl font-bold text-primary">{stats.topGenre}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Total Time</p>
                <p className="text-lg font-bold text-white">{stats.days > 0 && `${stats.days}D `}{stats.hours}H {stats.minutes}M</p>
              </div>
            </div>
          </div>

          <div className="w-1/2 pl-8 flex flex-col justify-between z-10">
            <p className="text-[10px] text-muted uppercase tracking-widest font-semibold mb-4">Top 4 Favorites</p>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {[0, 1, 2, 3].map(index => {
                const m = movies.find(x => x.id === topFavorites[index]);
                return m && m.poster_path ? (
                  <div key={index} className="aspect-[2/3] rounded-xl overflow-hidden border border-white/15 shadow-lg">
                    <img src={IMG.poster(m.poster_path, 'w342')!} crossOrigin="anonymous" alt={m.title} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div key={index} className="aspect-[2/3] rounded-xl bg-white/5 border border-white/10" />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
