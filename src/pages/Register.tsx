import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Shuffle, AlertCircle, Sparkles, ArrowRight, X, Eye, EyeOff } from '@/lib/icons';
import { useAuthStore } from '../store/authStore';
import WelcomeModal from '../components/WelcomeModal';

// Générateur de nom d'utilisateur anonyme
const generateAnonymousUsername = (): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let username = 'ano_';
  for (let i = 0; i < 7; i++) {
    username += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  
  return username;
};

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', // Stocke seulement la partie personnalisée (sans "ano_")
    password: '',
    password_confirmation: '',
    gender: 'male' as 'male' | 'female',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [newUser, setNewUser] = useState<{username: string, avatar: string} | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameSuggestion, setUsernameSuggestion] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleGenerateUsername = () => {
    const generated = generateAnonymousUsername();
    // Extraire seulement la partie après "ano_"
    const suffix = generated.slice(4);
    setFormData({ ...formData, username: suffix });
  };

  const handleUsernameChange = (value: string) => {
    // L'utilisateur tape seulement la partie personnalisée
    // On nettoie et limite à 7 caractères
    const trimmed = value.replace(/\s+/g, '');
    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 7);
    setFormData({ ...formData, username: normalized });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('Vous devez accepter les Conditions d\'Utilisation et la Politique de Confidentialité pour continuer.');
      return;
    }

    // Construire le nom complet avec "ano_" + partie personnalisée
    const customPart = formData.username.trim();
    
    if (customPart.length === 0) {
      // Si l'utilisateur n'a rien tapé, suggérer un nom généré
      const generated = generateAnonymousUsername();
      setUsernameSuggestion(generated);
      setShowUsernameModal(true);
      return;
    }

    // Construire le nom complet
    const fullUsername = `ano_${customPart}`;

    // Password validation: min 7 chars, at least one uppercase, one digit, one special char
    const pwd = formData.password;
    const checks: string[] = [];
    if (pwd.length < 7) checks.push('au moins 7 caractères');
    if (!/[A-Z]/.test(pwd)) checks.push('une majuscule');
    if (!/[0-9]/.test(pwd)) checks.push('un chiffre');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) checks.push('un caractère spécial');

    if (checks.length > 0) {
      setError(`Mot de passe invalide — veuillez inclure ${checks.join(', ')}.`);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      // Envoyer le nom complet avec "ano_"
      await register({
        ...formData,
        username: fullUsername,
      });
      // Afficher le modal de bienvenue avant la redirection
      setNewUser({
        username: fullUsername,
        avatar: formData.gender === 'male' ? '👨' : '👩'
      });
      setShowWelcomeModal(true);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erreur lors de l\'inscription. Merci de réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    // Rediriger vers la connexion après fermeture du modal
    const fullUsername = `ano_${formData.username}`;
    navigate('/login', { 
      state: { 
        username: fullUsername,
        password: formData.password,
        message: 'Inscription réussie ! Cliquez sur "Se connecter" pour accéder à votre compte.'
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 relative overflow-hidden bg-black">
      {/* Background animé avec catégories - même que Login */}
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
        <div className="absolute top-1/4 left-1/3 text-8xl opacity-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}>🔐</div>
        <div className="absolute top-1/3 right-1/4 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0.5s', animationDuration: '6.5s'}}>💬</div>
        
        {/* ROW 2 - Middle */}
        <div className="absolute top-1/2 left-1/4 text-9xl opacity-20 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '7s'}}>🕊️</div>
        <div className="absolute top-2/5 right-1/3 text-8xl opacity-20 animate-bounce" style={{animationDelay: '0.8s', animationDuration: '5.5s'}}>⛓️</div>
        <div className="absolute top-1/2 right-20 text-9xl opacity-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '6s'}}>✊</div>
        <div className="absolute top-3/5 left-20 text-8xl opacity-20 animate-bounce" style={{animationDelay: '1.2s', animationDuration: '6.5s'}}>💜</div>

        {/* ROW 3 - Bottom */}
        <div className="absolute bottom-20 left-1/4 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0.3s', animationDuration: '7s'}}>🎤</div>
        <div className="absolute bottom-10 right-1/4 text-8xl opacity-20 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '5s'}}>🔓</div>
        <div className="absolute bottom-1/3 right-1/3 text-9xl opacity-20 animate-bounce" style={{animationDelay: '0.7s', animationDuration: '6.5s'}}>💭</div>
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
          <h1 className="text-4xl font-bold text-white mb-3">Inscription Anonyme</h1>
          <p className="text-white/60">Créez votre identité 100% anonyme</p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                Nom d'utilisateur anonyme
              </label>
              <div className="space-y-3">
                <div className="relative flex items-center">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10 pointer-events-none" />
                  {/* Préfixe fixe "ano_" */}
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 text-white/70 font-medium z-10 pointer-events-none select-none">
                    ano_
                  </div>
                  {/* Input pour la partie personnalisée */}
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    required
                    maxLength={7}
                    className="w-full pl-[4.5rem] pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                    placeholder="votre_nom"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateUsername}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-lg transition border border-white/20"
                >
                  <Shuffle className="w-4 h-4" />
                  <span className="text-sm">Générer un nom aléatoire</span>
                </button>
                <p className="text-xs text-white/50">
                  💡 Le préfixe <span className="text-pink-300 font-semibold">"ano_"</span> est ajouté automatiquement
                </p>
                <p className="text-xs text-white/40">
                  ✍️ Ajoutez jusqu'à <span className="text-pink-300 font-semibold">7 caractères</span> pour personnaliser votre identité
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Genre (pour votre avatar)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-3 px-4 border-2 rounded-xl font-medium transition ${
                    formData.gender === 'male'
                      ? 'border-pink-500 bg-pink-500/10 text-white'
                      : 'border-white/20 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  👨 Homme
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-3 px-4 border-2 rounded-xl font-medium transition ${
                    formData.gender === 'female'
                      ? 'border-pink-500 bg-pink-500/10 text-white'
                      : 'border-white/20 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  👩 Femme
                </button>
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
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={7}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-2">Doit contenir au moins 7 caractères, une majuscule, un chiffre et un caractère spécial.</p>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-white/80 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  required
                  minLength={7}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  aria-label={showConfirm ? 'Cacher la confirmation' : 'Afficher la confirmation'}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-white/30 text-pink-500 focus:ring-2 focus:ring-pink-500/50 cursor-pointer"
              />
              <label htmlFor="acceptTerms" className="text-sm text-white/70 cursor-pointer">
                J'accepte les{' '}
                <Link to="/policies" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 font-medium">
                  Conditions d'Utilisation
                </Link>
                {' '}et la{' '}
                <Link to="/policies" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 font-medium">
                  Politique de Confidentialité
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
            >
              {loading ? 'Inscription...' : 'Créer mon compte anonyme'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {newUser && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={handleWelcomeModalClose}
          username={newUser.username}
          avatar={newUser.avatar}
        />
      )}

      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="relative w-full max-w-md mx-4">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-pink-500/40 via-purple-500/30 to-blue-500/30" aria-hidden="true" />
            <div className="relative bg-[#120d25]/90 border border-white/10 rounded-3xl p-8 shadow-[0_30px_120px_-30px_rgba(236,72,153,0.75)]">
              <button
                type="button"
                onClick={() => setShowUsernameModal(false)}
                className="absolute right-5 top-5 text-white/40 hover:text-white transition"
                aria-label="Fermer l'alerte"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-5">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-bold text-white leading-snug">
                  Nom d'utilisateur requis
                </h2>
                <p className="text-sm text-white/70 leading-relaxed">
                  Vous devez ajouter au moins quelques caractères pour personnaliser votre identité.
                  Le préfixe <span className="text-pink-300 font-semibold">"ano_"</span> est ajouté automatiquement ✨
                </p>

                <div className="bg-white/5 border border-white/15 rounded-2xl p-5 text-left space-y-3">
                  <p className="text-white/80 text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-300" />
                    <span>Tu peux mettre jusqu'à <span className="font-semibold text-pink-200">7 caractères</span> après le préfixe.</span>
                  </p>
                  <p className="text-white/70 text-sm flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-300" />
                    <span>Exemple validé : <code className="bg-black/40 px-2 py-1 rounded-lg border border-white/10">{usernameSuggestion || 'ano_swagga'}</code></span>
                  </p>
                  <p className="text-white/60 text-xs">
                    😎 Tu peux aussi cliquer sur &laquo; Générer un nom aléatoire &raquo; pour que je te trouve un blaze fresh !
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = usernameSuggestion || generateAnonymousUsername();
                      // Extraire seulement la partie après "ano_"
                      const suffix = suggestion.startsWith('ano_') ? suggestion.slice(4) : suggestion;
                      setFormData({ ...formData, username: suffix });
                      setShowUsernameModal(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold shadow-[0_20px_60px_-25px_rgba(236,72,153,0.8)] hover:shadow-[0_30px_80px_-20px_rgba(236,72,153,0.9)] transition"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Ajouter automatiquement {usernameSuggestion || 'ano_newbie'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUsernameModal(false)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 transition"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>Je corrige mon pseudo moi-même</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
