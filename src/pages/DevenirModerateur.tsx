import { useState, useEffect } from 'react';
import { Shield, Check, Clock, Users, AlertTriangle, Award, ChevronDown, Calendar, Globe } from '@/lib/icons';
import { useSEO } from '../hooks/useSEO';

export default function DevenirModerateur() {
  // SEO Optimization
  useSEO({
    title: 'Devenir Modérateur AnoSUNU | Rejoins l\'équipe',
    description: 'Candidatez pour devenir modérateur chez AnoSUNU. Contribuez à une communauté libre et sécurisée. Avantages, prérequis et processus de candidature.',
    keywords: 'devenir modérateur, moderateur anosunu, moderateur senegal, opportunite travail, benevolat',
    canonicalUrl: 'https://www.anosunu.com/devenir-moderateur'
  });
  
  const [formData, setFormData] = useState({
    nom: '',
    disponibilite: '',
    age: '',
    fuseauHoraire: '',
    experience: '',
    motivation: '',
    langues: [] as string[],
    documents: [] as File[],
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [userInfo, setUserInfo] = useState<{name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
  const token = localStorage.getItem('auth_token');
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const user = await response.json();
          setUserInfo(user);

          // Pré-remplir automatiquement les champs avec les infos utilisateur
          if (user.name) {
            const moderatorName = user.name.replace('ano_', 'mod_');
            setFormData(prev => ({
              ...prev,
              nom: moderatorName,
            }));
          }
        } else {
          console.error('❌ Failed to fetch user info, status:', response.status);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos utilisateur:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

  // Basic validation debug removed in production

    if (!formData.disponibilite || !formData.age || !formData.fuseauHoraire || !formData.motivation || !formData.experience) {
  // Validation failed - required fields missing

      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

  // Validation passed

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      formDataToSend.append('full_name', formData.nom);
      formDataToSend.append('availability', formData.disponibilite);
      formDataToSend.append('age_range', formData.age);
      formDataToSend.append('timezone', formData.fuseauHoraire);
      formDataToSend.append('motivation', formData.motivation);

      if (formData.experience) {
        formDataToSend.append('experience', formData.experience);
      }

      if (formData.langues.length > 0) {
        formDataToSend.append('languages', JSON.stringify(formData.langues));
      }

      if (formData.documents.length > 0) {
        formData.documents.forEach((doc, index) => {
          formDataToSend.append(`documents[${index}]`, doc);
        });
      }

      const token = localStorage.getItem('auth_token');
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/moderator/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formDataToSend
      });

  const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
        return; // Ne pas afficher l'alerte, le modal s'en occupe
      } else {
        console.error('❌ Server returned error:', response.status, response.statusText);
        console.error('❌ Error data:', data);

        // Vérifier si c'est l'erreur "déjà une demande en attente"
        if (data.error && data.error.includes('déjà une demande en attente')) {
          setErrorMessage(data.error);
          setShowErrorModal(true);
        } else {
          alert(data.error || 'Erreur lors de la soumission');
        }
      }
    } catch (error) {
      console.error('❌ Network/Parse error:', error);
      alert('Erreur lors de la soumission de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Devenir Modérateur Certifié</h1>
          </div>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Rejoignez notre équipe de modération et aidez à maintenir un environnement sain et respectueux pour tous les utilisateurs.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Informations */}
          <div className="lg:col-span-1 space-y-4">
            {/* Avantages */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span>Avantages</span>
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Badge modérateur certifié</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Accès aux outils de modération</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Salon privé modérateurs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Formation continue</span>
                </li>
              </ul>
            </div>

            {/* Prérequis */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Prérequis</span>
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Âge minimum : 18 ans</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Disponibilité régulière</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Expérience en modération</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Neutralité et objectivité</span>
                </li>
              </ul>
            </div>

            {/* Responsabilités */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>Responsabilités</span>
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Examiner les signalements</li>
                <li>• Appliquer les règles communautaires</li>
                <li>• Répondre aux utilisateurs</li>
                <li>• Participer aux réunions d'équipe</li>
                <li>• Maintenir la confidentialité</li>
              </ul>
            </div>
          </div>

          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Formulaire de candidature</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Informations utilisateur (automatique) */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/80 mb-2">Informations de candidature</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Nom modérateur:</span>
                      <p className="text-white font-mono">{formData.nom || 'Chargement...'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mt-2">Ces informations sont générées automatiquement depuis votre compte anonyme.</p>
                </div>

                {/* Motivation */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Pourquoi souhaitez-vous devenir modérateur ? *
                  </label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                    placeholder="Expliquez votre motivation et ce que vous apporteriez à l'équipe..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 min-h-[100px] resize-none"
                    required
                  />
                </div>

                {/* Expérience */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Expérience en modération ou gestion communautaire *
                  </label>
                  <textarea
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    placeholder="Décrivez votre expérience pertinente (forums, Discord, réseaux sociaux, etc.)..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 min-h-[80px] resize-none"
                    required
                  />
                </div>

                {/* Disponibilité hebdomadaire */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Disponibilité hebdomadaire *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.disponibilite}
                      onChange={(e) => setFormData({...formData, disponibilite: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent hover:bg-white/15 transition-colors"
                      required
                    >
                      <option value="" className="bg-gray-900 text-white">Sélectionnez votre disponibilité</option>
                      <option value="5-10h" className="bg-gray-900 text-white">5-10 heures par semaine</option>
                      <option value="10-20h" className="bg-gray-900 text-white">10-20 heures par semaine</option>
                      <option value="20-30h" className="bg-gray-900 text-white">20-30 heures par semaine</option>
                      <option value="30h+" className="bg-gray-900 text-white">Plus de 30 heures par semaine</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Âge */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Âge *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent hover:bg-white/15 transition-colors"
                      required
                    >
                      <option value="" className="bg-gray-900 text-white">Sélectionnez votre tranche d'âge</option>
                      <option value="18-24" className="bg-gray-900 text-white">18-24 ans</option>
                      <option value="25-34" className="bg-gray-900 text-white">25-34 ans</option>
                      <option value="35-44" className="bg-gray-900 text-white">35-44 ans</option>
                      <option value="45+" className="bg-gray-900 text-white">45 ans et plus</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Fuseau horaire */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Fuseau horaire *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.fuseauHoraire}
                      onChange={(e) => setFormData({...formData, fuseauHoraire: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent hover:bg-white/15 transition-colors"
                      required
                    >
                      <option value="" className="bg-gray-900 text-white">Sélectionnez votre fuseau horaire</option>
                      <option value="GMT+1" className="bg-gray-900 text-white">GMT+1 (Paris, Berlin, Madrid)</option>
                      <option value="GMT" className="bg-gray-900 text-white">GMT (Londres, Dublin)</option>
                      <option value="GMT-5" className="bg-gray-900 text-white">GMT-5 (New York, Toronto)</option>
                      <option value="GMT-8" className="bg-gray-900 text-white">GMT-8 (Los Angeles, Vancouver)</option>
                      <option value="GMT+9" className="bg-gray-900 text-white">GMT+9 (Tokyo, Seoul)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Documents justificatifs */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Documents justificatifs (optionnel)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setFormData(prev => ({ ...prev, documents: files }));
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600"
                    />
                    <p className="text-xs text-white/50">
                      Formats acceptés : PDF, JPG, PNG. Taille max : 5MB par fichier.
                    </p>
                    {formData.documents.length > 0 && (
                      <div className="text-sm text-white/70">
                        {formData.documents.length} fichier(s) sélectionné(s)
                      </div>
                    )}
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 w-4 h-4 text-pink-500 bg-transparent border-white/30 rounded focus:ring-pink-500"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-white/70">
                      J'accepte les conditions de modération et m'engage à respecter la charte de neutralité et de confidentialité. Je comprends que ma candidature sera examinée par l'équipe existante.
                    </label>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition shadow-lg"
                >
                  Soumettre ma candidature
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8 max-w-md w-full text-center border border-green-400/30 shadow-2xl">
            {/* Emoji de succès animé */}
            <div className="text-6xl mb-6 animate-bounce">
              🎉✨
            </div>

            {/* Titre avec emoji */}
            <h2 className="text-2xl font-bold text-white mb-4">
              🎊 Demande Soumise ! 🎊
            </h2>

            {/* Message personnalisé en wolof/français */}
            <div className="text-green-100 mb-6 space-y-2">
              <p className="text-lg">
                <strong>Salam NIDIAY wala SOKHNA! 👋</strong>
              </p>
              <p className="text-base">
                Ta demande de devenir modérateur a été bien reçue ! 📬
              </p>
              <p className="text-sm text-green-200">
                Quand ta demande sera acceptée, tu seras notifié. ⏰
              </p>
            </div>

            {/* Animation de chargement */}
            <div className="flex justify-center items-center space-x-1 text-green-300 mb-6">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>

            {/* Bouton pour fermer */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                // Reset form après fermeture du modal
                setFormData(prev => ({
                  ...prev,
                  disponibilite: '',
                  age: '',
                  fuseauHoraire: '',
                  experience: '',
                  motivation: '',
                  langues: [],
                  documents: [],
                }));
              }}
              className="w-full py-3 px-6 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all duration-300 border border-white/30 hover:border-white/50"
            >
              D'accord, merci ! 👍
            </button>

            {/* Petit message en bas */}
            <p className="text-xs text-green-300 mt-4">
              L'équipe te contactera bientôt... 💬
            </p>
          </div>
        </div>
      )}

      {/* Modal d'erreur pour demande déjà en attente */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl p-8 max-w-md w-full text-center border border-orange-400/30 shadow-2xl">
            {/* Emoji d'avertissement animé */}
            <div className="text-6xl mb-6 animate-pulse">
              ⚠️😅
            </div>

            {/* Titre avec emoji */}
            <h2 className="text-2xl font-bold text-white mb-4">
              OUPS ! Nio gui toupe deh ! ⚡
            </h2>

            {/* Message d'erreur personnalisé */}
            <div className="text-orange-100 mb-6">
              <p className="text-lg mb-2">
                <strong>Vous avez déjà postulé ! 📝</strong>
              </p>
              <p className="text-base">
                Votre demande est en cours de traitement par l'équipe. ⏳
              </p>
              <p className="text-sm text-orange-200 mt-2">
                Patientez un peu, on vous contactera bientôt ! 📞
              </p>
            </div>

            {/* Animation d'attente */}
            <div className="flex justify-center items-center space-x-1 text-orange-300 mb-6">
              <div className="w-3 h-3 bg-orange-300 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-orange-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-3 h-3 bg-orange-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>

            {/* Bouton pour fermer */}
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-3 px-6 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all duration-300 border border-white/30 hover:border-white/50"
            >
              Je comprends ! 👍
            </button>

            {/* Petit message en bas */}
            <p className="text-xs text-orange-300 mt-4">
              Merci pour votre patience... 🕐
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
