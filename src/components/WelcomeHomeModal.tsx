import React, { useState, useEffect } from 'react';
import { Shield, Eye, Heart, Users, Star, CheckCircle } from '@/lib/icons';

interface WelcomeHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeHomeModal({ isOpen, onClose }: WelcomeHomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const welcomeSteps = [
    {
      title: "🎭 Bienvenue sur AnonExpress",
      content: "Votre espace d'expression 100% anonyme et sécurisé",
      icon: <Eye className="w-8 h-8 text-purple-400" />,
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      title: "🛡️ Votre anonymat est sacré",
      content: "Aucune donnée personnelle n'est collectée. Votre identité virtuelle vous appartient entièrement.",
      icon: <Shield className="w-8 h-8 text-blue-400" />,
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      title: "💝 Une communauté bienveillante",
      content: "Partagez vos pensées, posez vos questions, exprimez-vous librement dans un environnement respectueux.",
      icon: <Heart className="w-8 h-8 text-pink-400" />,
      color: "from-pink-500/20 to-red-500/20"
    },
    {
      title: "🌟 Comment ça fonctionne ?",
      content: "1. Créez votre identité anonyme\n2. Partagez vos posts librement\n3. Échangez avec la communauté\n4. Modérez si vous le souhaitez",
      icon: <Users className="w-8 h-8 text-green-400" />,
      color: "from-green-500/20 to-emerald-500/20"
    }
  ];

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % welcomeSteps.length);
      }, 3000); // Change step every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentWelcomeStep = welcomeSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative bg-gradient-to-br ${currentWelcomeStep.color} backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl max-w-lg mx-4 transition-all duration-500`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Animated icon */}
          <div className="mb-6 flex justify-center">
            <div className={`w-16 h-16 bg-gradient-to-br ${currentWelcomeStep.color.replace('/20', '')} rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
              {currentWelcomeStep.icon}
            </div>
          </div>

          {/* Main title */}
          <h1 className="text-3xl font-bold text-white mb-4 animate-pulse">
            {currentWelcomeStep.title}
          </h1>

          {/* Content */}
          <div className="mb-8">
            <p className="text-white/90 text-lg leading-relaxed whitespace-pre-line">
              {currentWelcomeStep.content}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {welcomeSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center space-x-2 text-white/80">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Anonymat total</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Pas d'email requis</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Expression libre</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Communauté sûre</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30"
          >
            Découvrir AnonExpress 🚀
          </button>

          <p className="text-white/60 text-xs mt-4">
            Modal automatique • Change toutes les 3 secondes
          </p>
        </div>
      </div>
    </div>
  );
}
