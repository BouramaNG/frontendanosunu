import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, AlertCircle } from '@/lib/icons';
import { useAuthStore } from '../store/authStore';
import LoginSuccessModal from '../components/LoginSuccessModal';
import KeychainLoginModal from '../components/KeychainLoginModal';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loginUser, setLoginUser] = useState<{username: string, avatar: string, role?: string} | null>(null);
  const [showKeychainLogin, setShowKeychainLogin] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we came from registration with pre-filled data
    if (location.state) {
      const { username: prefilledUsername, password: prefilledPassword, message } = location.state;
      if (prefilledUsername) setUsername(prefilledUsername);
      if (prefilledPassword) setPassword(prefilledPassword);
      if (message) setSuccessMessage(message);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);

      // Get updated user from store after login
      const currentUser = useAuthStore.getState().user;
      
      // Redirection automatique pour les admins (sans attendre le modal)
      if (currentUser?.role === 'admin') {
        // Rediriger immédiatement vers le panel admin
        navigate('/anonymous', { replace: true });
        return;
      }
      
      // Pour les autres utilisateurs, afficher le modal de succès
      setLoginUser({
        username: username,
        avatar: '👨', // Default avatar
        role: currentUser?.role,
      });
      setShowSuccessModal(true);
    } catch (error) {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Redirection intelligente selon le rôle
    if (loginUser?.role === 'admin') {
      navigate('/anonymous'); // Admin → Panel Admin
    } else {
      navigate('/feed'); // Utilisateur normal → Espace Libre (Wax Sa Xalaat)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Background animé avec catégories */}
      <div className="absolute inset-0">
        {/* Gradient de base */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-pink-950"></div>
        
        {/* Cercles lumineux dégradés */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Catégories flottantes animées en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* ROW 1 - Top */}
        <div className="absolute top-10 left-10 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0s', animationDuration: '6s'}}>📌</div>
        <div className="absolute top-20 right-20 text-9xl opacity-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '7s'}}>🗣️</div>
        <div className="absolute top-1/4 left-1/3 text-8xl opacity-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}>�</div>
        <div className="absolute top-1/3 right-1/4 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0.5s', animationDuration: '6.5s'}}>�</div>
        
        {/* ROW 2 - Middle */}
        <div className="absolute top-1/2 left-1/4 text-9xl opacity-20 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '7s'}}>�️</div>
        <div className="absolute top-2/5 right-1/3 text-8xl opacity-20 animate-bounce" style={{animationDelay: '0.8s', animationDuration: '5.5s'}}>⛓️</div>
        <div className="absolute top-1/2 right-20 text-9xl opacity-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '6s'}}>✊</div>
        <div className="absolute top-3/5 left-20 text-8xl opacity-20 animate-bounce" style={{animationDelay: '1.2s', animationDuration: '6.5s'}}>�</div>

        {/* ROW 3 - Bottom */}
        <div className="absolute bottom-20 left-1/4 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0.3s', animationDuration: '7s'}}>🎤</div>
        <div className="absolute bottom-10 right-1/4 text-8xl opacity-20 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '5s'}}>�</div>
        <div className="absolute bottom-1/3 right-1/3 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0.7s', animationDuration: '6.5s'}}>�</div>
        <div className="absolute bottom-1/4 left-1/3 text-8xl opacity-20 animate-bounce" style={{animationDelay: '1.8s', animationDuration: '5.5s'}}>🌟</div>

        {/* EXTRA - Corners */}
        <div className="absolute -top-10 -right-10 text-9xl opacity-15 animate-pulse">💔</div>
        <div className="absolute -bottom-10 -left-10 text-9xl opacity-15 animate-pulse">🔗</div>
      </div>

      {/* Texte animé au-dessus - "Briser les chaînes" */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center opacity-5 scale-150">
          <h1 className="text-9xl font-black text-white mb-4" style={{textShadow: '0 0 40px rgba(236, 72, 153, 0.3)'}}>
            BRISER
          </h1>
          <p className="text-6xl font-black text-pink-500">LES CHAÎNES</p>
        </div>
      </div>

      {/* Contenu - Formulaire */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Connexion</h1>
          <p className="text-white/60">Connectez-vous à votre compte anonyme</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                {successMessage}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                Nom d'utilisateur anonyme
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                  placeholder="ano_abc12 ou votre nom anonyme"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            {/* Bouton Trousseau - Récupérer les identifiants */}
            <button
              type="button"
              onClick={() => setShowKeychainLogin(true)}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition border border-white/20 flex items-center justify-center gap-2"
            >
              🔑 Mon Trousseau
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-pink-400 hover:text-pink-300 font-medium">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>

        <KeychainLoginModal isOpen={showKeychainLogin} onClose={() => setShowKeychainLogin(false)} />

        {/* Login Success Modal */}
        {loginUser && (
          <LoginSuccessModal
            isOpen={showSuccessModal}
            onClose={handleSuccessModalClose}
            username={loginUser.username}
            avatar={loginUser.avatar}
          />
        )}
      </div>
    </div>
  );
}
