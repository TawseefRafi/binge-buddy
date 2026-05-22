import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../store/useStore';

const AVATAR_OPTIONS = [
  // Micah (Minimalist)
  'https://api.dicebear.com/7.x/micah/svg?seed=Cinephile&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/micah/svg?seed=ActionHero&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/micah/svg?seed=Director&backgroundColor=d1d4f9',
  
  // Fun Emoji
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=MindBlown&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Starstruck&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=CoolGlasses&backgroundColor=b6e3f4',
  
  // Avataaars (Expressive faces)
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Spock&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Matrix&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Trinity&backgroundColor=ffdfbf',
  
  // Big Smile (Quirky)
  'https://api.dicebear.com/7.x/big-smile/svg?seed=Joker&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/big-smile/svg?seed=Harley&backgroundColor=ffdfbf',
  
  // Big Ears (Funny)
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Gollum&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Yoda&backgroundColor=d1d4f9',
  
  // Bottts (Sci-Fi Robots)
  'https://api.dicebear.com/7.x/bottts/svg?seed=WallE&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=R2D2&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyberpunk&backgroundColor=c0aede',
  
  // Pixel Art (Retro Gaming/Movies)
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Arcade&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=RetroBoy&backgroundColor=ffdfbf',
  
  // Adventurer
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Indy&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lara&backgroundColor=c0aede',
  
  // Thumbs (Abstract/Cute)
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Popcorn&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Oscar&backgroundColor=d1d4f9',
];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { profile, updateUserProfile } = useStore();
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile && isOpen) {
      setUsername(profile.username);
      setSelectedAvatar(profile.avatar_url || AVATAR_OPTIONS[0]);
    }
  }, [profile, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const success = await updateUserProfile(username.trim(), selectedAvatar);
      if (success) {
        onClose();
      } else {
        setError('Failed to update profile. The username might already be taken.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="w-full max-w-md p-6 glass-panel rounded-2xl shadow-2xl relative border border-white/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-primary" /> Edit Profile
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-muted-light mb-2 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-muted" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="Your unique username"
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-light mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} /> Choose Avatar
                </label>
                <div className="grid grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-2 carousel-scroll">
                  {AVATAR_OPTIONS.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatar === avatar 
                          ? 'border-primary scale-105 shadow-lg shadow-primary/20' 
                          : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
