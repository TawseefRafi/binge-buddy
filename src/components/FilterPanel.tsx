import { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, X, User, Film, Globe, Search, Loader2, Award, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tmdbApi, IMG } from '../lib/tmdb';
import { useStore } from '../store/useStore';

interface FilterPanelProps {
  mediaType: 'movie' | 'tv';
  onApplyFilters: (filters: {
    genre?: string;
    country?: string;
    castId?: string;
    directorId?: string;
    castName?: string;
    directorName?: string;
    prize?: string;
  }) => void;
  onClearFilters: () => void;
}

interface Option {
  value: string;
  label: string;
  vibe?: string;
  borderColor?: string;
  glowColor?: string;
}

const COUNTRIES_OPTIONS: Option[] = [
  { 
    value: 'US', 
    label: 'United States', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #3c3b6e, #ffffff, #b22234)',
    glowColor: 'rgba(60, 59, 110, 0.4), rgba(255, 255, 255, 0.2), rgba(178, 34, 52, 0.4)'
  },
  { 
    value: 'GB', 
    label: 'United Kingdom', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #00247d, #ffffff, #cf142b)',
    glowColor: 'rgba(0, 36, 125, 0.4), rgba(255, 255, 255, 0.2), rgba(207, 20, 43, 0.4)'
  },
  { 
    value: 'JP', 
    label: 'Japan', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #ffffff, #bc002d, #ffffff)',
    glowColor: 'rgba(255, 255, 255, 0.3), rgba(188, 0, 45, 0.5)'
  },
  { 
    value: 'KR', 
    label: 'South Korea', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #ffffff, #cd1124, #0047a0, #000000)',
    glowColor: 'rgba(205, 17, 36, 0.4), rgba(0, 71, 160, 0.4)'
  },
  { 
    value: 'IN', 
    label: 'India', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #ff9933, #ffffff, #128807)',
    glowColor: 'rgba(255, 153, 51, 0.4), rgba(255, 255, 255, 0.2), rgba(18, 136, 7, 0.4)'
  },
  { 
    value: 'BD', 
    label: 'Bangladesh', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #006a4e, #f42a41, #006a4e)',
    glowColor: 'rgba(0, 106, 78, 0.5), rgba(244, 42, 65, 0.5)'
  },
  { 
    value: 'FR', 
    label: 'France', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #00209f, #ffffff, #f4263f)',
    glowColor: 'rgba(0, 32, 159, 0.4), rgba(255, 255, 255, 0.2), rgba(244, 38, 63, 0.4)'
  },
  { 
    value: 'DE', 
    label: 'Germany', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #000000, #dd0000, #ffce00)',
    glowColor: 'rgba(0, 0, 0, 0.5), rgba(221, 0, 0, 0.4), rgba(255, 206, 0, 0.4)'
  },
  { 
    value: 'CA', 
    label: 'Canada', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #ff0000, #ffffff, #ff0000)',
    glowColor: 'rgba(255, 0, 0, 0.5), rgba(255, 255, 255, 0.2)'
  },
  { 
    value: 'ES', 
    label: 'Spain', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #c60b1e, #ffc400, #c60b1e)',
    glowColor: 'rgba(198, 11, 30, 0.4), rgba(255, 196, 0, 0.4)'
  },
  { 
    value: 'IT', 
    label: 'Italy', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #009246, #ffffff, #ce2b37)',
    glowColor: 'rgba(0, 146, 70, 0.4), rgba(255, 255, 255, 0.2), rgba(206, 43, 55, 0.4)'
  },
  { 
    value: 'HK', 
    label: 'Hong Kong', 
    vibe: 'country',
    borderColor: 'linear-gradient(to right, #de2910, #ffffff, #de2910)',
    glowColor: 'rgba(222, 41, 16, 0.5), rgba(255, 255, 255, 0.2)'
  },
];

const GENRES_OPTIONS: Option[] = [
  { value: '28', label: 'Action', vibe: 'action' },
  { value: '12', label: 'Adventure', vibe: 'adventure' },
  { value: '16', label: 'Animation (Anime)', vibe: 'japan' },
  { value: '35', label: 'Comedy', vibe: 'comedy' },
  { value: '80', label: 'Crime', vibe: 'crime' },
  { value: '99', label: 'Documentary', vibe: 'documentary' },
  { value: '18', label: 'Drama', vibe: 'drama' },
  { value: '10751', label: 'Family', vibe: 'family' },
  { value: '14', label: 'Fantasy', vibe: 'fantasy' },
  { value: '27', label: 'Horror', vibe: 'horror' },
  { value: '9648', label: 'Mystery', vibe: 'mystery' },
  { value: '10749', label: 'Romance', vibe: 'romance' },
  { value: '878', label: 'Science Fiction', vibe: 'scifi' },
  { value: '53', label: 'Thriller', vibe: 'thriller' },
];

const PRIZES_OPTIONS: Option[] = [
  { value: 'Oscar', label: 'Oscars (Academy Awards)', vibe: 'oscar' },
  { value: 'Palme d\'Or', label: 'Cannes (Palme d\'Or)', vibe: 'cannes' },
  { value: 'Golden Globe', label: 'Golden Globes', vibe: 'goldenglobe' },
  { value: 'BAFTA', label: 'BAFTA Awards', vibe: 'bafta' },
  { value: 'Emmy', label: 'Emmy Awards', vibe: 'emmy' },
  { value: 'Venice Golden Lion', label: 'Venice (Golden Lion)', vibe: 'venice' },
  { value: 'Berlin Golden Bear', label: 'Berlin (Golden Bear)', vibe: 'berlin' },
  { value: 'Sundance Grand Jury', label: 'Sundance Grand Jury Prize', vibe: 'sundance' },
  { value: 'Anime Award', label: 'Crunchyroll Anime Awards', vibe: 'japan' },
];

interface CustomDropdownProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder: string;
  icon: React.ReactNode;
  onHoverVibe: (vibe: string | null, option: Option | null) => void;
}

export function CustomDropdown({ label, value, onChange, options, placeholder, icon, onHoverVibe }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOptionValue, setHoveredOptionValue] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${isOpen ? 'z-50' : 'z-20'}`}>
      <label className="block text-[10px] font-bold text-muted-light uppercase tracking-widest mb-1.5 flex items-center gap-1">
        {icon} {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => selectedOption?.vibe && onHoverVibe(selectedOption.vibe, selectedOption)}
        onMouseLeave={() => onHoverVibe(null, null)}
        style={selectedOption?.vibe === 'country' && selectedOption.borderColor ? {
          borderImage: `${selectedOption.borderColor} 1`,
          borderStyle: 'solid',
          boxShadow: selectedOption.glowColor ? `0 0 12px ${selectedOption.glowColor.split(',')[0] || ''}` : undefined
        } : undefined}
        className={`w-full flex items-center justify-between px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none cursor-pointer transition-all ${
          isOpen ? 'ring-1 ring-primary/45 border-primary/50' : ''
        } ${
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'horror' ? 'border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] text-red-500 font-mono' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'thriller' ? 'border-purple-500/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] text-purple-400 font-mono' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'france' ? 'border-france font-serif italic' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'japan' ? 'border-pink-500/50 hover:shadow-[0_0_10px_rgba(244,114,182,0.2)] text-pink-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'action' ? 'border-orange-500/50 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)] text-orange-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'adventure' ? 'border-emerald-500/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] text-emerald-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'comedy' ? 'border-yellow-500/50 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)] text-yellow-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'crime' ? 'border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)] text-red-500 font-bold' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'documentary' ? 'border-zinc-500/50 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] text-white/90' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'drama' ? 'border-yellow-600/50 hover:shadow-[0_0_10px_rgba(253,224,71,0.15)] text-yellow-400 font-serif italic' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'family' ? 'border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-500' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'fantasy' ? 'border-indigo-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] text-indigo-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'mystery' ? 'border-purple-500/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] text-purple-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'romance' ? 'border-pink-500/50 hover:shadow-[0_0_10px_rgba(236,72,153,0.2)] text-pink-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'scifi' ? 'border-cyan-500/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'oscar' ? 'border-yellow-500/50 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)] text-yellow-400 font-serif italic' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'cannes' ? 'border-yellow-500/50 hover:shadow-[0_0_10px_rgba(234,179,8,0.15)] text-yellow-400 font-serif' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'goldenglobe' ? 'border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'bafta' ? 'border-amber-600/50 hover:shadow-[0_0_10px_rgba(194,65,12,0.15)] text-amber-500 font-serif' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'emmy' ? 'border-yellow-500/50 hover:shadow-[0_0_10px_rgba(234,179,8,0.15)] text-yellow-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'venice' ? 'border-blue-500/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] text-blue-400' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'berlin' ? 'border-zinc-500/50 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] text-zinc-300' :
          selectedOption?.vibe !== 'country' && selectedOption?.vibe === 'sundance' ? 'border-sky-500/50 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] text-sky-400' : ''
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 bg-[#1f1f2e] border border-white/20 rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.85)] z-40 max-h-56 overflow-y-auto custom-scroll"
          >
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                onHoverVibe(null, null);
              }}
              className="w-full text-left px-3 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              {placeholder}
            </button>
            {options.map((option) => {
              const isSelected = option.value === value;
              const isHovered = hoveredOptionValue === option.value;
              let optionClass = "w-full text-left px-3 py-2 text-xs transition-all flex items-center justify-between cursor-pointer relative overflow-hidden ";
              if (isSelected) {
                optionClass += "bg-primary/20 text-primary font-bold ";
              } else {
                optionClass += "text-white/80 hover:bg-white/10 hover:text-white ";
              }

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    onHoverVibe(null, null);
                    setHoveredOptionValue(null);
                  }}
                  onMouseEnter={() => {
                    setHoveredOptionValue(option.value);
                    if (option.vibe) onHoverVibe(option.vibe, option);
                  }}
                  onMouseLeave={() => {
                    setHoveredOptionValue(null);
                    onHoverVibe(null, null);
                  }}
                  style={isHovered && option.vibe === 'country' && option.glowColor ? {
                    boxShadow: `inset 0 0 12px ${option.glowColor}`,
                    borderLeft: '2px solid transparent',
                    borderImage: `${option.borderColor} 1`
                  } : undefined}
                  className={`${optionClass} ${
                    option.vibe === 'horror' ? 'hover:text-red-500 hover:bg-red-950/20' :
                    option.vibe === 'thriller' ? 'hover:text-purple-400 hover:bg-purple-950/20' :
                    option.vibe === 'france' ? 'hover:text-blue-300 hover:bg-blue-950/10' :
                    option.vibe === 'japan' ? 'hover:text-pink-400 hover:bg-pink-950/20' :
                    option.vibe === 'action' ? 'hover:text-orange-400 hover:bg-orange-950/20' :
                    option.vibe === 'adventure' ? 'hover:text-emerald-400 hover:bg-emerald-950/20' :
                    option.vibe === 'comedy' ? 'hover:text-yellow-400 hover:bg-yellow-950/20' :
                    option.vibe === 'crime' ? 'hover:text-red-500 hover:bg-red-950/20' :
                    option.vibe === 'documentary' ? 'hover:text-white/90 hover:bg-zinc-800/20' :
                    option.vibe === 'drama' ? 'hover:text-yellow-400 hover:bg-yellow-950/20' :
                    option.vibe === 'family' ? 'hover:text-amber-500 hover:bg-amber-950/20' :
                    option.vibe === 'fantasy' ? 'hover:text-indigo-400 hover:bg-indigo-950/20' :
                    option.vibe === 'mystery' ? 'hover:text-purple-400 hover:bg-purple-950/20' :
                    option.vibe === 'romance' ? 'hover:text-pink-400 hover:bg-pink-950/20' :
                    option.vibe === 'scifi' ? 'hover:text-cyan-400 hover:bg-cyan-950/20' : 
                    option.vibe === 'oscar' ? 'hover:text-yellow-400 hover:bg-yellow-950/20' :
                    option.vibe === 'cannes' ? 'hover:text-yellow-400 hover:bg-yellow-950/20' :
                    option.vibe === 'goldenglobe' ? 'hover:text-amber-400 hover:bg-amber-950/20' :
                    option.vibe === 'bafta' ? 'hover:text-amber-500 hover:bg-amber-950/20' :
                    option.vibe === 'emmy' ? 'hover:text-yellow-400 hover:bg-yellow-950/20' :
                    option.vibe === 'venice' ? 'hover:text-blue-400 hover:bg-blue-950/20' :
                    option.vibe === 'berlin' ? 'hover:text-zinc-300 hover:bg-zinc-800/20' :
                    option.vibe === 'sundance' ? 'hover:text-sky-400 hover:bg-sky-950/20' : ''
                  }`}
                >
                  {/* Dynamic interactive vibe overlays */}
                  {isHovered && option.vibe === 'action' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-orange-950/15">
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-muzzle-flash" />
                      <div className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-yellow-300 to-orange-500 rounded-full animate-bullet-fire" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'adventure' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-emerald-950/10">
                      <svg className="absolute w-3 h-3 text-emerald-400 animate-leaf-drift" style={{ top: '20%', animationDelay: '0s' }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.04,18C13,18 19,13 22,8C22,8 19,5 17,8Z" />
                      </svg>
                      <svg className="absolute w-2.5 h-2.5 text-green-500 animate-leaf-drift opacity-80" style={{ top: '60%', animationDelay: '0.8s' }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.04,18C13,18 19,13 22,8C22,8 19,5 17,8Z" />
                      </svg>
                    </div>
                  )}
                  {isHovered && option.vibe === 'japan' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-pink-950/10">
                      <div className="absolute -top-2 left-[20%] w-2 h-1.5 bg-pink-300 rounded-full animate-sakura-float" style={{ animationDelay: '0s' }} />
                      <div className="absolute -top-2 left-[70%] w-1.5 h-1 bg-pink-400 rounded-full animate-sakura-float" style={{ animationDelay: '0.7s' }} />
                    </div>
                  )}
                  {isHovered && option.vibe === 'comedy' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-yellow-950/10">
                      <div className="absolute bottom-[-10px] left-[25%] w-2 h-2 rounded-full bg-yellow-400 animate-bubble-up" style={{ animationDelay: '0s' }} />
                      <div className="absolute bottom-[-10px] left-[55%] w-1.5 h-1.5 rounded-full bg-pink-400 animate-bubble-up" style={{ animationDelay: '0.4s' }} />
                      <div className="absolute bottom-[-10px] left-[80%] w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bubble-up" style={{ animationDelay: '0.8s' }} />
                    </div>
                  )}
                  {isHovered && option.vibe === 'crime' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 animate-police-flash flex">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_8px_#ef4444]" />
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 shadow-[0_0_8px_#3b82f6]" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'documentary' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 p-1 opacity-80">
                      <div className="absolute inset-1 border border-white/20 rounded-[4px] animate-viewfinder" />
                      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-white animate-viewfinder" />
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-white animate-viewfinder" />
                      <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-white animate-viewfinder" />
                      <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-white animate-viewfinder" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'drama' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-red-950/15">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-32 bg-[radial-gradient(ellipse_at_top,rgba(253,224,71,0.2),transparent_60%)] animate-spotlight" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'family' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-amber-950/10">
                      <svg className="absolute w-3.5 h-4.5 text-amber-500 animate-balloon" style={{ left: '20%', animationDelay: '0s' }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A6,6 0 0,1 18,8C18,11.3 15.3,14 12,14C8.7,14 6,11.3 6,8A6,6 0 0,1 12,2M12,14C12,17.3 9.3,20 6,20H4V22H6C10.4,22 14,18.4 14,14H12Z" />
                      </svg>
                      <svg className="absolute w-2.5 h-3.5 text-orange-400 animate-balloon opacity-75" style={{ left: '70%', animationDelay: '1.2s' }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A6,6 0 0,1 18,8C18,11.3 15.3,14 12,14C8.7,14 6,11.3 6,8A6,6 0 0,1 12,2M12,14C12,17.3 9.3,20 6,20H4V22H6C10.4,22 14,18.4 14,14H12Z" />
                      </svg>
                    </div>
                  )}
                  {isHovered && option.vibe === 'fantasy' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-indigo-950/15">
                      <span className="absolute top-1 left-[30%] text-[8px] text-yellow-200 animate-sparkle" style={{ animationDelay: '0s' }}>✦</span>
                      <span className="absolute top-2 left-[60%] text-[9px] text-purple-300 animate-sparkle" style={{ animationDelay: '0.4s' }}>✦</span>
                      <span className="absolute top-1 left-[85%] text-[7px] text-cyan-200 animate-sparkle" style={{ animationDelay: '0.8s' }}>✦</span>
                    </div>
                  )}
                  {isHovered && option.vibe === 'horror' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-red-950/20">
                      <div className="absolute animate-bat-option-1 top-0 left-0">
                        <svg className="w-4 h-4 text-zinc-950 animate-bat-flap" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 6c.7 0 1.4.2 2 .5.4-.7 1-1.2 1.8-1.5.3 1.5-.1 3-.9 4.2 1 .8 1.8 1.9 2.2 3.1.9-.3 1.8-.8 2.6-1.5-.5 2-1.7 3.6-3.3 4.5.6.8 1 1.7 1.3 2.7-1.3-.4-2.5-1.1-3.5-2-.9.8-2 1.4-3.2 1.7-.2-1.1-.7-2-1.5-2.7-.8.7-1.3 1.6-1.5 2.7-1.2-.3-2.3-.9-3.2-1.7-1 .9-2.2 1.6-3.5 2 .3-1 .7-1.9 1.3-2.7-1.6-.9-2.8-2.5-3.3-4.5.8.7 1.7 1.2 2.6 1.5.4-1.2 1.2-2.3 2.2-3.1-.8-1.2-1.2-2.7-.9-4.2.8.3 1.4.8 1.8 1.5.6-.3 1.3-.5 2-.5z" />
                        </svg>
                      </div>
                      <div className="absolute animate-bat-option-2 top-0 left-0">
                        <svg className="w-3.5 h-3.5 text-zinc-950 animate-bat-flap" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 6c.7 0 1.4.2 2 .5.4-.7 1-1.2 1.8-1.5.3 1.5-.1 3-.9 4.2 1 .8 1.8 1.9 2.2 3.1.9-.3 1.8-.8 2.6-1.5-.5 2-1.7 3.6-3.3 4.5.6.8 1 1.7 1.3 2.7-1.3-.4-2.5-1.1-3.5-2-.9.8-2 1.4-3.2 1.7-.2-1.1-.7-2-1.5-2.7-.8.7-1.3 1.6-1.5 2.7-1.2-.3-2.3-.9-3.2-1.7-1 .9-2.2 1.6-3.5 2 .3-1 .7-1.9 1.3-2.7-1.6-.9-2.8-2.5-3.3-4.5.8.7 1.7 1.2 2.6 1.5.4-1.2 1.2-2.3 2.2-3.1-.8-1.2-1.2-2.7-.9-4.2.8.3 1.4.8 1.8 1.5.6-.3 1.3-.5 2-.5z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {isHovered && option.vibe === 'mystery' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-purple-950/15">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-800/10 via-indigo-900/10 to-transparent w-[200%] animate-fog" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'romance' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-pink-950/15">
                      <div className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full animate-rose-float" style={{ left: '30%', animationDelay: '0s' }} />
                      <div className="absolute w-2 h-2 bg-red-400/70 rounded-full animate-rose-float" style={{ left: '75%', animationDelay: '1.2s' }} />
                    </div>
                  )}
                  {isHovered && option.vibe === 'scifi' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-cyan-950/15">
                      <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-400/40 shadow-[0_0_6px_#22d3ee] animate-cyber-scanline" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'thriller' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-purple-950/15 animate-glitch-flicker" />
                  )}
                  {isHovered && option.vibe === 'france' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20 bg-gradient-to-r from-blue-600 via-white to-red-600 animate-flag-slide" />
                  )}
                  {isHovered && option.vibe === 'country' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-25"
                         style={{
                           background: `linear-gradient(to right, ${option.borderColor?.replace('linear-gradient(to right, ', '').replace(')', '') || 'transparent'})`,
                           filter: `blur(4px)`
                         }}
                    />
                  )}
                  {isHovered && option.vibe === 'oscar' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-yellow-950/15">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-32 bg-[radial-gradient(ellipse_at_top,rgba(253,224,71,0.25),transparent_60%)] animate-spotlight" />
                      <span className="absolute top-1 left-[25%] text-[7px] text-yellow-200 animate-sparkle" style={{ animationDelay: '0s' }}>✦</span>
                      <span className="absolute top-3 left-[70%] text-[8px] text-yellow-300 animate-sparkle" style={{ animationDelay: '0.5s' }}>✦</span>
                    </div>
                  )}
                  {isHovered && option.vibe === 'cannes' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-yellow-950/10 flex items-center justify-between px-4 opacity-30">
                      <span className="text-[12px] text-yellow-400 rotate-12 animate-pulse">🌿</span>
                      <span className="text-[12px] text-yellow-400 -rotate-12 animate-pulse">🌿</span>
                    </div>
                  )}
                  {isHovered && option.vibe === 'goldenglobe' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-amber-950/15">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-amber-500/30 border-dashed animate-spin-slow" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-500/10 blur-[1px]" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'bafta' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-amber-950/10 flex items-center justify-center gap-4 opacity-25">
                      <span className="text-[11px] text-amber-400">🎭</span>
                    </div>
                  )}
                  {isHovered && option.vibe === 'emmy' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-yellow-950/15">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-3 rounded-full border border-yellow-400/40 rotate-[30deg] animate-spin-slow" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-3 rounded-full border border-yellow-400/40 -rotate-[30deg] animate-spin-slow" />
                    </div>
                  )}
                  {isHovered && option.vibe === 'venice' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-blue-950/20">
                      <div className="absolute inset-0 animate-wave-ripple bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-transparent" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-yellow-400 opacity-30">🦁</span>
                    </div>
                  )}
                  {isHovered && option.vibe === 'berlin' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-r from-zinc-700/20 via-yellow-600/10 to-zinc-700/20 animate-pulse" />
                  )}
                  {isHovered && option.vibe === 'sundance' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-sky-950/20">
                      <span className="absolute top-[-5px] left-[30%] text-[7px] text-sky-200 animate-snow-fall" style={{ animationDelay: '0s' }}>❄</span>
                      <span className="absolute top-[-5px] left-[70%] text-[8px] text-sky-200 animate-snow-fall" style={{ animationDelay: '1.2s' }}>❄</span>
                    </div>
                  )}

                  <span className={`relative z-10 flex items-center gap-1.5 ${
                    option.vibe === 'horror' ? 'font-mono text-red-500' :
                    option.vibe === 'thriller' ? 'font-mono text-purple-400' :
                    option.vibe === 'france' ? 'font-serif italic' : ''
                  }`}>
                    {option.label}
                  </span>
                  {isSelected && <span className="text-[10px] relative z-10">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterPanel({ onApplyFilters, onClearFilters }: FilterPanelProps) {
  const { apiKey } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPrize, setSelectedPrize] = useState('');

  // Autocomplete states for Cast
  const [castInput, setCastInput] = useState('');
  const [castSuggestions, setCastSuggestions] = useState<any[]>([]);
  const [selectedCast, setSelectedCast] = useState<any | null>(null);
  const [isSearchingCast, setIsSearchingCast] = useState(false);

  // Autocomplete states for Director
  const [directorInput, setDirectorInput] = useState('');
  const [directorSuggestions, setDirectorSuggestions] = useState<any[]>([]);
  const [selectedDirector, setSelectedDirector] = useState<any | null>(null);
  const [isSearchingDirector, setIsSearchingDirector] = useState(false);

  const castRef = useRef<HTMLDivElement>(null);
  const directorRef = useRef<HTMLDivElement>(null);

  // Sensory vibe state
  const [hoveredVibe, setHoveredVibe] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<Option | null>(null);

  // Close suggestion dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (castRef.current && !castRef.current.contains(e.target as Node)) {
        setCastSuggestions([]);
      }
      if (directorRef.current && !directorRef.current.contains(e.target as Node)) {
        setDirectorSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Cast Autocomplete
  useEffect(() => {
    if (!castInput.trim() || !apiKey || selectedCast) {
      setCastSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingCast(true);
      try {
        const results = await tmdbApi.searchPerson(castInput, apiKey);
        setCastSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCast(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [castInput, apiKey, selectedCast]);

  // Search Director Autocomplete
  useEffect(() => {
    if (!directorInput.trim() || !apiKey || selectedDirector) {
      setDirectorSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDirector(true);
      try {
        const results = await tmdbApi.searchPerson(directorInput, apiKey);
        setDirectorSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingDirector(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [directorInput, apiKey, selectedDirector]);

  const handleApply = () => {
    onApplyFilters({
      genre: selectedGenre || undefined,
      country: selectedCountry || undefined,
      castId: selectedCast?.id?.toString() || undefined,
      directorId: selectedDirector?.id?.toString() || undefined,
      castName: selectedCast?.name || undefined,
      directorName: selectedDirector?.name || undefined,
      prize: selectedPrize || undefined,
    });
  };

  const handleClear = () => {
    setSelectedGenre('');
    setSelectedCountry('');
    setSelectedPrize('');
    setCastInput('');
    setSelectedCast(null);
    setDirectorInput('');
    setSelectedDirector(null);
    onClearFilters();
  };

  // Find vibes of currently selected options to persist them
  const selectedGenreOption = GENRES_OPTIONS.find(o => o.value === selectedGenre);
  const selectedCountryOption = COUNTRIES_OPTIONS.find(o => o.value === selectedCountry);
  const selectedPrizeOption = PRIZES_OPTIONS.find(o => o.value === selectedPrize);

  const activeOption = hoveredOption || selectedGenreOption || selectedCountryOption || selectedPrizeOption;
  const activeVibe = hoveredVibe || activeOption?.vibe;

  let borderGlowClass = 'border-white/5 bg-transparent';
  if (activeVibe && activeVibe !== 'country') {
    switch (activeVibe) {
      case 'horror':
        borderGlowClass = 'border-red-800/60 bg-red-950/5 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-horror-pulse';
        break;
      case 'thriller':
        borderGlowClass = 'border-purple-800/60 bg-purple-950/5 shadow-[0_0_25px_rgba(168,85,247,0.2)] animate-glitch-flicker';
        break;
      case 'japan':
        borderGlowClass = 'border-pink-800/60 bg-pink-950/5 shadow-[0_0_25px_rgba(244,114,182,0.2)]';
        break;
      case 'action':
        borderGlowClass = 'border-orange-800/60 bg-orange-950/5 shadow-[0_0_25px_rgba(249,115,22,0.2)] animate-fire-pulse';
        break;
      case 'adventure':
        borderGlowClass = 'border-emerald-800/60 bg-emerald-950/5 shadow-[0_0_25px_rgba(16,185,129,0.25)]';
        break;
      case 'comedy':
        borderGlowClass = 'border-yellow-800/60 bg-yellow-950/5 shadow-[0_0_25px_rgba(234,179,8,0.25)]';
        break;
      case 'crime':
        borderGlowClass = 'border-red-900/65 bg-red-950/5 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-police-flash border-2';
        break;
      case 'documentary':
        borderGlowClass = 'border-zinc-700 bg-zinc-900/5 shadow-[0_0_25px_rgba(255,255,255,0.08)]';
        break;
      case 'drama':
        borderGlowClass = 'border-yellow-800/60 bg-yellow-950/5 shadow-[0_0_25px_rgba(253,224,71,0.15)]';
        break;
      case 'family':
        borderGlowClass = 'border-amber-800/60 bg-amber-950/5 shadow-[0_0_25px_rgba(245,158,11,0.25)]';
        break;
      case 'fantasy':
        borderGlowClass = 'border-indigo-800/60 bg-indigo-950/5 shadow-[0_0_25px_rgba(99,102,241,0.25)]';
        break;
      case 'mystery':
        borderGlowClass = 'border-purple-800/60 bg-purple-950/5 shadow-[0_0_25px_rgba(168,85,247,0.25)]';
        break;
      case 'romance':
        borderGlowClass = 'border-pink-800/60 bg-pink-950/5 shadow-[0_0_25px_rgba(236,72,153,0.25)]';
        break;
      case 'scifi':
        borderGlowClass = 'border-cyan-800/60 bg-cyan-950/5 shadow-[0_0_25px_rgba(6,182,212,0.25)]';
        break;
      case 'france':
        borderGlowClass = 'border-transparent border-france bg-blue-950/5 shadow-[0_0_25px_rgba(59,130,246,0.15)]';
        break;
      case 'oscar':
        borderGlowClass = 'border-yellow-600/60 bg-yellow-950/5 shadow-[0_0_25px_rgba(234,179,8,0.3)] animate-gold-pulse';
        break;
      case 'cannes':
        borderGlowClass = 'border-yellow-600/50 bg-yellow-950/5 shadow-[0_0_25px_rgba(234,179,8,0.2)] animate-gold-pulse';
        break;
      case 'goldenglobe':
        borderGlowClass = 'border-amber-600/60 bg-amber-950/5 shadow-[0_0_25px_rgba(245,158,11,0.3)]';
        break;
      case 'bafta':
        borderGlowClass = 'border-amber-700/60 bg-amber-950/5 shadow-[0_0_25px_rgba(194,65,12,0.25)]';
        break;
      case 'emmy':
        borderGlowClass = 'border-yellow-600/55 bg-yellow-950/5 shadow-[0_0_25px_rgba(234,179,8,0.25)]';
        break;
      case 'venice':
        borderGlowClass = 'border-blue-700/60 bg-blue-950/5 shadow-[0_0_25px_rgba(29,78,216,0.35)]';
        break;
      case 'berlin':
        borderGlowClass = 'border-zinc-500/60 bg-zinc-950/5 shadow-[0_0_25px_rgba(240,240,240,0.15)]';
        break;
      case 'sundance':
        borderGlowClass = 'border-sky-700/60 bg-sky-950/5 shadow-[0_0_25px_rgba(14,165,233,0.3)]';
        break;
    }
  }

  const handleHoverVibe = (v: string | null, opt: Option | null) => {
    setHoveredVibe(v);
    setHoveredOption(opt);
  };

  return (
    <div className="w-full mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
          isOpen || selectedGenre || selectedCountry || selectedPrize || selectedCast || selectedDirector
            ? 'bg-primary/20 border-primary/50 text-white shadow-lg shadow-primary/10'
            : 'border-white/10 hover:border-white/20 text-muted-light bg-white/5'
        }`}
      >
        <SlidersHorizontal size={14} />
        {isOpen ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
        {(selectedGenre || selectedCountry || selectedPrize || selectedCast || selectedDirector) && (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse ml-1" />
        )}
      </button>

      {isOpen && (
        <div
          style={activeOption?.vibe === 'country' && activeOption.borderColor ? {
            borderImage: `${activeOption.borderColor} 1`,
            borderStyle: 'solid',
            boxShadow: activeOption.glowColor ? `0 0 25px ${activeOption.glowColor.split(',')[0] || ''}` : undefined
          } : undefined}
          className={`mt-4 p-6 glass-light border rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 relative transition-all duration-500 ${borderGlowClass}`}
        >
          {/* Ambient overlays */}
          {activeVibe === 'horror' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(127,29,29,0.15)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                <div className="absolute animate-bat-panel-1 top-0 left-0">
                  <svg className="w-6 h-6 text-zinc-950/80 animate-bat-flap" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 6c.7 0 1.4.2 2 .5.4-.7 1-1.2 1.8-1.5.3 1.5-.1 3-.9 4.2 1 .8 1.8 1.9 2.2 3.1.9-.3 1.8-.8 2.6-1.5-.5 2-1.7 3.6-3.3 4.5.6.8 1 1.7 1.3 2.7-1.3-.4-2.5-1.1-3.5-2-.9.8-2 1.4-3.2 1.7-.2-1.1-.7-2-1.5-2.7-.8.7-1.3 1.6-1.5 2.7-1.2-.3-2.3-.9-3.2-1.7-1 .9-2.2 1.6-3.5 2 .3-1 .7-1.9 1.3-2.7-1.6-.9-2.8-2.5-3.3-4.5.8.7 1.7 1.2 2.6 1.5.4-1.2 1.2-2.3 2.2-3.1-.8-1.2-1.2-2.7-.9-4.2.8.3 1.4.8 1.8 1.5.6-.3 1.3-.5 2-.5z" />
                  </svg>
                </div>
                <div className="absolute animate-bat-panel-2 top-0 left-0">
                  <svg className="w-5 h-5 text-zinc-900/70 animate-bat-flap" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 6c.7 0 1.4.2 2 .5.4-.7 1-1.2 1.8-1.5.3 1.5-.1 3-.9 4.2 1 .8 1.8 1.9 2.2 3.1.9-.3 1.8-.8 2.6-1.5-.5 2-1.7 3.6-3.3 4.5.6.8 1 1.7 1.3 2.7-1.3-.4-2.5-1.1-3.5-2-.9.8-2 1.4-3.2 1.7-.2-1.1-.7-2-1.5-2.7-.8.7-1.3 1.6-1.5 2.7-1.2-.3-2.3-.9-3.2-1.7-1 .9-2.2 1.6-3.5 2 .3-1 .7-1.9 1.3-2.7-1.6-.9-2.8-2.5-3.3-4.5.8.7 1.7 1.2 2.6 1.5.4-1.2 1.2-2.3 2.2-3.1-.8-1.2-1.2-2.7-.9-4.2.8.3 1.4.8 1.8 1.5.6-.3 1.3-.5 2-.5z" />
                  </svg>
                </div>
                <div className="absolute animate-bat-panel-3 top-0 left-0">
                  <svg className="w-4 h-4 text-zinc-950/60 animate-bat-flap" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 6c.7 0 1.4.2 2 .5.4-.7 1-1.2 1.8-1.5.3 1.5-.1 3-.9 4.2 1 .8 1.8 1.9 2.2 3.1.9-.3 1.8-.8 2.6-1.5-.5 2-1.7 3.6-3.3 4.5.6.8 1 1.7 1.3 2.7-1.3-.4-2.5-1.1-3.5-2-.9.8-2 1.4-3.2 1.7-.2-1.1-.7-2-1.5-2.7-.8.7-1.3 1.6-1.5 2.7-1.2-.3-2.3-.9-3.2-1.7-1 .9-2.2 1.6-3.5 2 .3-1 .7-1.9 1.3-2.7-1.6-.9-2.8-2.5-3.3-4.5.8.7 1.7 1.2 2.6 1.5.4-1.2 1.2-2.3 2.2-3.1-.8-1.2-1.2-2.7-.9-4.2.8.3 1.4.8 1.8 1.5.6-.3 1.3-.5 2-.5z" />
                  </svg>
                </div>
              </div>
            </>
          )}
          {activeVibe === 'thriller' && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[linear-gradient(to_bottom,rgba(168,85,247,0.03)_50%,rgba(0,0,0,0)_50%)] bg-[size:100%_4px] z-10" />
          )}
          {activeVibe === 'japan' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(244,114,182,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(8)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-pink-300 rounded-full animate-sakura-float opacity-70"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: '-10px',
                      animationDelay: `${i * 0.4}s`,
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {activeVibe === 'action' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(249,115,22,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                <div className="absolute top-[25%] left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-300 to-orange-500 rounded-full animate-bullet-fire-panel" style={{ animationDelay: '0s' }} />
                <div className="absolute top-[65%] left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-300 to-orange-500 rounded-full animate-bullet-fire-panel" style={{ animationDelay: '0.9s' }} />
              </div>
            </>
          )}
          {activeVibe === 'adventure' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(16,185,129,0.06)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(6)].map((_, i) => (
                  <svg
                    key={i}
                    className="absolute w-3.5 h-3.5 text-emerald-400 animate-leaf-drift"
                    style={{
                      left: `${-5}%`,
                      top: `${15 + i * 15}%`,
                      animationDelay: `${i * 0.4}s`,
                    }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.04,18C13,18 19,13 22,8C22,8 19,5 17,8Z" />
                  </svg>
                ))}
              </div>
            </>
          )}
          {activeVibe === 'comedy' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(234,179,8,0.06)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(8)].map((_, i) => {
                  const colors = ['bg-yellow-400', 'bg-pink-400', 'bg-cyan-400', 'bg-green-400'];
                  const size = [8, 6, 10, 5][i % 4];
                  return (
                    <div
                      key={i}
                      className={`absolute bottom-[-15px] rounded-full animate-bubble-up ${colors[i % colors.length]}`}
                      style={{
                        left: `${10 + i * 12}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
          {activeVibe === 'crime' && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl animate-police-flash opacity-15 z-10" />
          )}
          {activeVibe === 'documentary' && (
            <div className="absolute inset-2 pointer-events-none border border-white/10 rounded-xl z-10 p-2">
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white animate-viewfinder" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white animate-viewfinder" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white animate-viewfinder" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white animate-viewfinder" />
            </div>
          )}
          {activeVibe === 'drama' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(253,224,71,0.05)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10 bg-red-950/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-64 bg-[radial-gradient(ellipse_at_top,rgba(253,224,71,0.15),transparent_60%)] animate-spotlight" />
              </div>
            </>
          )}
          {activeVibe === 'family' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(245,158,11,0.06)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(6)].map((_, i) => {
                  const colors = ['text-amber-500', 'text-orange-400', 'text-red-400', 'text-yellow-400'];
                  return (
                    <svg
                      key={i}
                      className={`absolute w-6 h-8 animate-balloon ${colors[i % colors.length]}`}
                      style={{
                        left: `${10 + i * 16}%`,
                        animationDelay: `${i * 0.6}s`,
                      }}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12,2A6,6 0 0,1 18,8C18,11.3 15.3,14 12,14C8.7,14 6,11.3 6,8A6,6 0 0,1 12,2M12,14C12,17.3 9.3,20 6,20H4V22H6C10.4,22 14,18.4 14,14H12Z" />
                    </svg>
                  );
                })}
              </div>
            </>
          )}
          {activeVibe === 'fantasy' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(99,102,241,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(12)].map((_, i) => {
                  const sizes = ['text-[8px]', 'text-[11px]', 'text-[9px]'];
                  const colors = ['text-yellow-200', 'text-purple-300', 'text-cyan-200', 'text-indigo-300'];
                  return (
                    <span
                      key={i}
                      className={`absolute animate-sparkle ${sizes[i % sizes.length]} ${colors[i % colors.length]}`}
                      style={{
                        left: `${8 + i * 8}%`,
                        top: `${10 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    >
                      ✦
                    </span>
                  );
                })}
              </div>
            </>
          )}
          {activeVibe === 'mystery' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(168,85,247,0.06)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-800/10 via-indigo-900/10 to-transparent w-[200%] animate-fog" />
              </div>
            </>
          )}
          {activeVibe === 'romance' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(236,72,153,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(8)].map((_, i) => {
                  const colors = ['bg-pink-400', 'bg-red-400/80', 'bg-rose-300'];
                  const sizes = ['w-2 h-2', 'w-1.5 h-1.5', 'w-2.5 h-2.5'];
                  return (
                    <div
                      key={i}
                      className={`absolute rounded-full animate-rose-float ${colors[i % colors.length]} ${sizes[i % sizes.length]}`}
                      style={{
                        left: `${12 + i * 11}%`,
                        top: '-10px',
                        animationDelay: `${i * 0.35}s`,
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
          {activeVibe === 'scifi' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(6,182,212,0.06)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-400/30 shadow-[0_0_8px_#22d3ee] animate-cyber-scanline" />
              </div>
            </>
          )}
          {activeVibe === 'country' && activeOption && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10 opacity-10"
                 style={{
                   background: `linear-gradient(to right, ${activeOption.borderColor?.replace('linear-gradient(to right, ', '').replace(')', '') || 'transparent'})`,
                   filter: `blur(8px)`
                 }}
            />
          )}
          {activeVibe === 'oscar' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(234,179,8,0.06)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-64 bg-[radial-gradient(ellipse_at_top,rgba(253,224,71,0.15),transparent_60%)] animate-spotlight" />
                {[...Array(8)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-yellow-200 animate-sparkle"
                    style={{
                      left: `${10 + i * 11}%`,
                      top: `${20 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.35}s`,
                    }}
                  >✦</span>
                ))}
              </div>
            </>
          )}
          {activeVibe === 'cannes' && (
            <>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10 opacity-15">
                <span className="text-[32px] text-yellow-400 rotate-12">🌿</span>
              </div>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none z-10 opacity-15">
                <span className="text-[32px] text-yellow-400 -rotate-12">🌿</span>
              </div>
            </>
          )}
          {activeVibe === 'goldenglobe' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_30%,rgba(245,158,11,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border border-amber-500/10 border-dashed animate-spin-slow" />
              </div>
            </>
          )}
          {activeVibe === 'bafta' && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(194,65,12,0.06)_100%)] z-10 flex items-center justify-between px-16 opacity-10">
              <span className="text-[48px] text-amber-500">🎭</span>
              <span className="text-[48px] text-amber-500">🎭</span>
            </div>
          )}
          {activeVibe === 'emmy' && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10 flex items-center justify-center opacity-15">
              <div className="absolute w-56 h-12 rounded-full border border-yellow-400/20 rotate-[45deg] animate-spin-slow" />
              <div className="absolute w-56 h-12 rounded-full border border-yellow-400/20 -rotate-[45deg] animate-spin-slow" />
            </div>
          )}
          {activeVibe === 'venice' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(59,130,246,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                <div className="absolute inset-0 animate-wave-ripple bg-[linear-gradient(to_bottom,rgba(59,130,246,0.06)_0%,rgba(0,0,0,0)_100%)] bg-[size:100%_8px]" />
              </div>
            </>
          )}
          {activeVibe === 'berlin' && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-r from-zinc-700/5 via-yellow-600/5 to-zinc-700/5 z-10 animate-pulse" />
          )}
          {activeVibe === 'sundance' && (
            <>
              <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(14,165,233,0.08)_100%)] z-10" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-sky-200/60 animate-snow-fall text-[10px]"
                    style={{
                      left: `${8 + i * 8}%`,
                      top: '-10px',
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >❄</span>
                ))}
              </div>
            </>
          )}

          {/* Nationality & Genre (Column 1) */}
          <div className="space-y-4">
            <CustomDropdown
              label="Nationality / Country"
              value={selectedCountry}
              onChange={setSelectedCountry}
              options={COUNTRIES_OPTIONS}
              placeholder="Any Country"
              icon={<Globe size={11} className="text-primary" />}
              onHoverVibe={handleHoverVibe}
            />

            <CustomDropdown
              label="Genre"
              value={selectedGenre}
              onChange={setSelectedGenre}
              options={GENRES_OPTIONS}
              placeholder="Any Genre"
              icon={<Film size={11} className="text-primary" />}
              onHoverVibe={handleHoverVibe}
            />
          </div>

          {/* Cast Search & Prize Search (Column 2) */}
          <div className="space-y-4">
            <div ref={castRef} className={`relative ${castSuggestions.length > 0 ? 'z-30' : 'z-20'}`}>
              <label className="block text-[10px] font-bold text-muted-light uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <User size={11} className="text-primary" /> Cast Member / Actor
              </label>
              {selectedCast ? (
                <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-white">
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedCast.profile_path ? (
                      <img
                        src={IMG.profile(selectedCast.profile_path, 'w45')!}
                        alt=""
                        className="w-6 h-6 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px]">
                        {selectedCast.name[0]}
                      </div>
                    )}
                    <span className="truncate font-semibold">{selectedCast.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCast(null);
                      setCastInput('');
                    }}
                    className="text-muted hover:text-white p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={castInput}
                    onChange={(e) => setCastInput(e.target.value)}
                    placeholder="e.g. Leonardo DiCaprio"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                  <Search size={12} className="absolute left-3 top-3 text-muted" />
                  {isSearchingCast && (
                    <Loader2 size={12} className="absolute right-3 top-3 text-primary animate-spin" />
                  )}

                  {/* Suggestions dropdown */}
                  {castSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-[#1f1f2e] border border-white/20 rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.85)] z-40 max-h-48 overflow-y-auto custom-scroll">
                      {castSuggestions.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => setSelectedCast(person)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-white/5 text-white transition-colors cursor-pointer"
                        >
                          {person.profile_path ? (
                            <img
                              src={IMG.profile(person.profile_path, 'w45')!}
                              alt=""
                              className="w-6 h-6 object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                              {person.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{person.name}</p>
                            <p className="text-[9px] text-muted">
                              {person.known_for_department || 'Acting'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <CustomDropdown
              label="Filter by Prize / Award"
              value={selectedPrize}
              onChange={setSelectedPrize}
              options={PRIZES_OPTIONS}
              placeholder="Any Accolade"
              icon={<Award size={11} className="text-primary" />}
              onHoverVibe={handleHoverVibe}
            />
          </div>

          {/* Director Search (Column 3) */}
          <div className="space-y-4">
            <div ref={directorRef} className={`relative ${directorSuggestions.length > 0 ? 'z-30' : 'z-20'}`}>
              <label className="block text-[10px] font-bold text-muted-light uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <User size={11} className="text-primary" /> Director / Crew
              </label>
              {selectedDirector ? (
                <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-white">
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedDirector.profile_path ? (
                      <img
                        src={IMG.profile(selectedDirector.profile_path, 'w45')!}
                        alt=""
                        className="w-6 h-6 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px]">
                        {selectedDirector.name[0]}
                      </div>
                    )}
                    <span className="truncate font-semibold">{selectedDirector.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDirector(null);
                      setDirectorInput('');
                    }}
                    className="text-muted hover:text-white p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={directorInput}
                    onChange={(e) => setDirectorInput(e.target.value)}
                    placeholder="e.g. Christopher Nolan"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                  <Search size={12} className="absolute left-3 top-3 text-muted" />
                  {isSearchingDirector && (
                    <Loader2 size={12} className="absolute right-3 top-3 text-primary animate-spin" />
                  )}

                  {/* Suggestions dropdown */}
                  {directorSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-[#1f1f2e] border border-white/20 rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.85)] z-40 max-h-48 overflow-y-auto custom-scroll">
                      {directorSuggestions.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => setSelectedDirector(person)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-white/5 text-white transition-colors cursor-pointer"
                        >
                          {person.profile_path ? (
                            <img
                              src={IMG.profile(person.profile_path, 'w45')!}
                              alt=""
                              className="w-6 h-6 object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                              {person.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{person.name}</p>
                            <p className="text-[9px] text-muted">
                              {person.known_for_department || 'Directing'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="col-span-1 md:col-span-3 pt-4 border-t border-white/5 flex gap-2 justify-end relative z-20">
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-muted-light hover:bg-white/5 hover:text-white cursor-pointer transition-all"
            >
              Clear Filters
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.45)]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
