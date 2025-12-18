import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Plus, Sparkles, Users } from '@/lib/icons';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Ne pas afficher sur certaines pages (login, register, etc.) et dans une chambre noire (détail)
  const hiddenPaths = ['/login', '/register'];
  const isInBlackRoom = location.pathname.startsWith('/black-rooms/');
  const shouldHide = hiddenPaths.includes(location.pathname) || isInBlackRoom || !isAuthenticated;

  if (shouldHide) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const handleCreatePost = () => {
    // Si on est déjà sur le feed, scroller vers le formulaire
    if (location.pathname === '/feed') {
      const postForm = document.getElementById('post-form-container');
      if (postForm) {
        postForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Déclencher l'expansion du formulaire compact si présent
        const compactForm = document.querySelector('[data-compact-post-form]');
        if (compactForm) {
          (compactForm as HTMLElement).click();
        }
      }
    } else {
      // Rediriger vers le feed (depuis l'accueil ou ailleurs)
      navigate('/feed');
      // Attendre que la page se charge puis scroller
      setTimeout(() => {
        const postForm = document.getElementById('post-form-container');
        if (postForm) {
          postForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const compactForm = document.querySelector('[data-compact-post-form]');
          if (compactForm) {
            (compactForm as HTMLElement).click();
          }
        }
      }, 300);
    }
  };

  const handleFollowersClick = () => {
    // Bloqué - fonctionnalité à venir (v2)
    // Ne rien faire ou afficher un message
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Fond avec blur et bordure */}
      <div className="bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-around relative">
            {/* Icône Chambres Noires (Gauche) avec Badge Premium */}
            <button
              onClick={() => navigate('/chambres-noires')}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 relative',
                isActive('/chambres-noires')
                  ? 'text-purple-300 bg-purple-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
              aria-label="Chambres Noires"
            >
              <div className="relative">
                <div
                  className={cn(
                    'p-2.5 rounded-xl transition-all relative',
                    isActive('/chambres-noires')
                      ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30'
                      : 'bg-white/5'
                  )}
                >
                  <Lock className="w-5 h-5" />
                </div>
                {/* Badge Premium */}
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full blur-sm opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full px-2 py-1 flex items-center gap-0.5 shadow-lg border border-amber-300/50">
                      <Sparkles className="w-3 h-3 text-white" fill="white" />
                      <span className="text-[10px] font-bold text-white leading-none">PRO</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium">Chambres</span>
            </button>

            {/* Bouton Publication Central (Style TikTok) */}
            <button
              onClick={handleCreatePost}
              className="relative -mt-6 flex items-center justify-center"
              aria-label="Créer une publication"
            >
              {/* Cercle externe avec gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-fuchsia-600 rounded-full blur-md opacity-60 animate-pulse"></div>

              {/* Bouton principal */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-pink-500/50 transition-all duration-300 hover:scale-110 active:scale-95">
                <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
              </div>
            </button>

            {/* Icône Followers (Droite) - Bloqué */}
            <button
              onClick={handleFollowersClick}
              disabled
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 relative opacity-60 cursor-not-allowed',
                'text-white/50'
              )}
              aria-label="Followers (À venir bientôt)"
              title="À venir bientôt"
            >
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-white/5">
                  <Users className="w-5 h-5" />
                </div>
                {/* Badge "À venir bientôt" */}
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full px-2 py-1 flex items-center gap-0.5 shadow-lg border border-blue-300/50">
                      <span className="text-[10px] font-bold text-white leading-none">Bientôt</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium">Followers</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

