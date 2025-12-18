import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Lock, Scale, FileText, AlertCircle, HelpCircle } from '@/lib/icons';

interface PolicyTab {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: string;
}

export default function PoliciesPage() {
  const [expandedTab, setExpandedTab] = useState<string>('confidentiality');

  const policies: PolicyTab[] = [
    {
      id: 'confidentiality',
      title: 'Politique de Confidentialité',
      icon: <Lock className="w-5 h-5" />,
      description: 'Comment nous protégeons vos données',
      content: `
# 🔒 Politique de Confidentialité

## Ce que nous collectons

**Minimum requis:**
- Nom d'utilisateur anonyme
- Mot de passe (chiffré)
- Email optionnel (récupération)

**CE QUE NOUS NE COLLECTONS PAS:**
- ❌ Vrai nom
- ❌ Adresse
- ❌ Numéro téléphone
- ❌ Localisation GPS
- ❌ Données biométriques

## Sécurité

✅ Chiffrement AES-256
✅ HTTPS/TLS transmission
✅ Bcrypt passwords
✅ Pas de cloud tiers

## Vos droits

✅ Droit d'accès
✅ Droit rectification
✅ Droit à l'oubli
✅ Droit portabilité

Contact: privacy@anosunu.com
      `
    },
    {
      id: 'moderation',
      title: 'Conditions d\'Utilisation',
      icon: <Scale className="w-5 h-5" />,
      description: 'Règles et sanctions',
      content: `
# ⚖️ Conditions d'Utilisation

## Contenus Interdits

🔴 **Interdit:**
- Contenu sexuel / Pédophilie
- Harcèlement / Menaces
- Discrimination religieuse
- Contenu illégal
- Drogue / Trafic
- Données personnelles (doxing)
- Appels à violence
- Manipulation / Fraude

## Sanctions

**Contenu léger:**
- 1ère: ⚠️ Avertissement
- 2ème: 🗑️ Suppression
- 3ème: 🔒 Blocage 30j

**Contenu grave:**
- 1ère: ❌ Blocage/Suppression
- Autorités signalées

## Appels

📧 Délai: 30 jours
Contact: moderation@anosunu.com
Réponse: 72h maximum
      `
    },
    {
      id: 'apoliticism',
      title: 'Politique d\'Apolitisme',
      icon: <Scale className="w-5 h-5" />,
      description: 'Débat politique équitable',
      content: `
# 🤝 Politique d'Apolitisme

## Ce que nous garantissons

✅ Liberté expression politique
✅ Égalité tous partis
✅ Pas de censure arbitraire
✅ Débat encouragé

## Accepté

✅ Critiquer gouvernement
✅ Débats politiques
✅ Protestation non-violente
✅ Propositions réformes
✅ Comparaison partis

## Interdit

❌ Appels coup d'État
❌ Terrorisme / Extrémisme
❌ Atteinte intégrité nationale
❌ Déstabilisation forcée
❌ Collaboration occupation

## Apolitisme = Impartialité

Pas prise de position ≠ Pas de politique autorisée

Débat accepté, violence interdite.
      `
    },
    {
      id: 'accountability',
      title: 'Charte de Responsabilité',
      icon: <FileText className="w-5 h-5" />,
      description: 'Notre engagement et transparence',
      content: `
# ⚖️ Charte de Responsabilité

## Notre engagement

✅ Modération équitable
✅ Transparence totale
✅ Respect droits
✅ Sécurité garantie

## Données légales

Signalons UNIQUEMENT:
- Pédophilie
- Terrorisme
- Crimes graves

Avec:
- Mandat judiciaire valide
- Validation procédure
- Notification utilisateur (si légal)

## Rapports publics

📊 Annuellement:
- Suppressions par type
- Demandes gouvernement
- Données transférées
- Incidents sécurité

## Appels garantis

À partir de: moderation@anosunu.com
Délai réponse: 72h maximum
Équipe indépendante: Oui
      `
    }
  ];

  const faqs = [
    {
      q: 'Collectez-vous mon vrai nom?',
      a: 'Non. Nous collectons le minimum: nom anonyme, mot de passe, email optionnel.'
    },
    {
      q: 'Vendez-vous mes données?',
      a: 'Non, jamais. Vos données ne sont jamais vendues ou partagées avec tiers.'
    },
    {
      q: 'Puis-je parler de politique?',
      a: 'Oui, absolument! Anosunu garantit liberté expression. Débats politiques sont encouragés.'
    },
    {
      q: 'Où est la limite politique?',
      a: 'Débat ok, mais pas: violence, terrorisme, déstabilisation, atteinte territoire.'
    },
    {
      q: 'Mon post est supprimé. Pourquoi?',
      a: 'Notification explique raison. Vous pouvez appeler via: Paramètres > Appels'
    },
    {
      q: 'Donnez-vous données aux gouvernements?',
      a: 'Seulement avec mandat judiciaire valide. Nous refusons demandes injustifiées.'
    },
    {
      q: 'Mes données sont-elles sûres?',
      a: 'Oui. Chiffrement AES-256, HTTPS, pas de cloud tiers. Infrastructure sécurisée.'
    },
    {
      q: 'Comment appeler une modération?',
      a: 'Email: moderation@anosunu.com ou App: Paramètres > Appels. Délai: 30 jours.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            📜 Centre Juridique & Politique
          </h1>
          <p className="text-xl text-slate-300">
            Comprendre nos engagements envers vous
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-lg p-4">
            <Shield className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-slate-300">Données sécurisées</div>
          </div>
          <div className="bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-lg p-4">
            <Lock className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-slate-300">Donnée vendue</div>
          </div>
          <div className="bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-lg p-4">
            <Scale className="w-6 h-6 text-yellow-400 mb-2" />
            <div className="text-2xl font-bold">Égal</div>
            <div className="text-sm text-slate-300">Traitement tous</div>
          </div>
          <div className="bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-lg p-4">
            <FileText className="w-6 h-6 text-purple-400 mb-2" />
            <div className="text-2xl font-bold">4</div>
            <div className="text-sm text-slate-300">Politiques claires</div>
          </div>
        </div>
      </div>

      {/* Policies Tabs */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold mb-6">📋 Nos Politiques Officielles</h2>
        
        <div className="space-y-4">
          {policies.map((policy) => (
            <div 
              key={policy.id}
              className="bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedTab(expandedTab === policy.id ? '' : policy.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-600/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-cyan-400">{policy.icon}</div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">{policy.title}</h3>
                    <p className="text-sm text-slate-300">{policy.description}</p>
                  </div>
                </div>
                {expandedTab === policy.id ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedTab === policy.id && (
                <div className="border-t border-slate-600/50 p-6 bg-slate-800/30 max-h-96 overflow-y-auto">
                  <div className="prose prose-invert max-w-none text-sm text-slate-300">
                    {policy.content.split('\n').map((line, i) => {
                      if (line.startsWith('#')) {
                        const level = line.match(/#/g)?.length || 1;
                        const text = line.replace(/#+ /, '');
                        return (
                          <div 
                            key={i} 
                            className={`${level === 1 ? 'text-xl font-bold text-white mt-4' : 'text-lg font-semibold text-cyan-300 mt-3'} mb-2`}
                          >
                            {text}
                          </div>
                        );
                      }
                      if (line.startsWith('✅') || line.startsWith('❌') || line.startsWith('🔴') || line.startsWith('⚠️')) {
                        return <div key={i} className="ml-4 my-1">{line}</div>;
                      }
                      if (line.startsWith('-')) {
                        return <div key={i} className="ml-4 my-1">{line}</div>;
                      }
                      return line.trim() && <div key={i} className="my-1">{line}</div>;
                    })}
                  </div>
                  <a 
                    href={`/policies/${policy.id}`}
                    className="inline-block mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Lire le document complet →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-yellow-400" />
          Questions Fréquentes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-lg p-4 hover:border-cyan-400/50 transition-colors"
            >
              <h4 className="font-semibold text-cyan-300 mb-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {faq.q}
              </h4>
              <p className="text-sm text-slate-300">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-cyan-400/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">📞 Besoin d'aide?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Support Général</h4>
              <a href="mailto:support@anosunu.com" className="text-blue-300 hover:text-blue-200">
                support@anosunu.com
              </a>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Données & Confidentialité</h4>
              <a href="mailto:privacy@anosunu.com" className="text-blue-300 hover:text-blue-200">
                privacy@anosunu.com
              </a>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Modération & Appels</h4>
              <a href="mailto:moderation@anosunu.com" className="text-blue-300 hover:text-blue-200">
                moderation@anosunu.com
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <p className="text-sm text-slate-300">
              🎯 Réponse garantie dans 48-72h | 📧 Contactez-nous dans votre langue
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-slate-700">
        <p className="text-center text-slate-400 text-sm">
          Merci de faire confiance à Anosunu. Ensemble, créons un internet respectueux, libre et sûr. ❤️
        </p>
      </div>
    </div>
  );
}
