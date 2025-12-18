// SVG Background Components for Voice Posts by Category
// These render directly without relying on public folder serving

export const PoliticsBackground = () => (
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <style>{`
        @keyframes pulse-light {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .pulsing { animation: pulse-light 3s ease-in-out infinite; }
        .floating { animation: float 4s ease-in-out infinite; }
      `}</style>
      <linearGradient id="politicsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0c1e3e" stopOpacity="1" />
        <stop offset="100%" stopColor="#2d1b4e" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#politicsGrad)" />
    <circle cx="150" cy="100" r="3" fill="#60a5fa" className="pulsing" />
    <circle cx="250" cy="150" r="2" fill="#60a5fa" className="pulsing" style={{animationDelay: '0.5s'}} />
    <circle cx="1050" cy="120" r="3" fill="#60a5fa" className="pulsing" style={{animationDelay: '1s'}} />
    <circle cx="1100" cy="200" r="2" fill="#60a5fa" className="pulsing" style={{animationDelay: '1.5s'}} />
    <rect x="200" y="350" width="800" height="350" fill="#1a2847" stroke="#60a5fa" strokeWidth="3" />
    <polygon points="600,200 750,350 450,350" fill="#0f1728" stroke="#60a5fa" strokeWidth="3" />
    <circle cx="600" cy="280" r="80" fill="none" stroke="#f59e0b" strokeWidth="4" className="floating" />
    <line x1="600" y1="280" x2="600" y2="220" stroke="#f59e0b" strokeWidth="3" />
    <line x1="600" y1="280" x2="650" y2="280" stroke="#f59e0b" strokeWidth="3" />
    <rect x="280" y="400" width="50" height="50" fill="#fbbf24" className="pulsing" />
    <rect x="380" y="400" width="50" height="50" fill="#fbbf24" className="pulsing" style={{animationDelay: '0.5s'}} />
    <rect x="480" y="400" width="50" height="50" fill="#fbbf24" className="pulsing" style={{animationDelay: '1s'}} />
    <rect x="680" y="400" width="50" height="50" fill="#fbbf24" className="pulsing" style={{animationDelay: '1.5s'}} />
    <rect x="780" y="400" width="50" height="50" fill="#fbbf24" className="pulsing" style={{animationDelay: '1s'}} />
    <rect x="880" y="400" width="50" height="50" fill="#fbbf24" className="pulsing" style={{animationDelay: '0.5s'}} />
    <rect x="330" y="380" width="35" height="320" fill="#2d1b4e" />
    <rect x="530" y="380" width="35" height="320" fill="#2d1b4e" />
    <rect x="730" y="380" width="35" height="320" fill="#2d1b4e" />
    <rect x="930" y="380" width="35" height="320" fill="#2d1b4e" />
  </svg>
);

export const RelationshipsBackground = () => (
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(30px) translateY(-30px); }
        }
        .heart { animation: heartbeat 1.2s ease-in-out infinite; transform-origin: center; }
        .floating-heart { animation: drift 5s ease-in-out infinite; }
      `}</style>
      <linearGradient id="relationshipsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#431407" stopOpacity="1" />
        <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#relationshipsGrad)" />
    <g className="floating-heart">
      <path d="M 200 200 C 200 150 250 100 300 100 C 330 100 360 115 380 140 C 400 115 430 100 460 100 C 510 100 560 150 560 200 C 560 280 380 400 380 400 C 380 400 200 280 200 200 Z" fill="#f43f5e" opacity="0.3" />
    </g>
    <g className="floating-heart" style={{animationDelay: '2s'}}>
      <path d="M 900 300 C 900 250 950 200 1000 200 C 1030 200 1060 215 1080 240 C 1100 215 1130 200 1160 200 C 1210 200 1260 250 1260 300 C 1260 380 1080 500 1080 500 C 1080 500 900 380 900 300 Z" fill="#fb7185" opacity="0.25" />
    </g>
    <circle cx="300" cy="350" r="35" fill="#ec4899" className="heart" />
    <circle cx="900" cy="350" r="35" fill="#ec4899" className="heart" style={{animationDelay: '0.6s'}} />
    <line x1="340" y1="350" x2="860" y2="350" stroke="#f472b6" strokeWidth="8" opacity="0.6" />
    <path d="M 500 330 C 500 315 510 305 520 305 C 525 305 530 310 535 320 C 540 310 545 305 550 305 C 560 305 570 315 570 330 C 570 350 535 370 535 370 C 535 370 500 350 500 330 Z" fill="#f472b6" className="heart" style={{animationDelay: '0.3s'}} />
    <path d="M 650 330 C 650 315 660 305 670 305 C 675 305 680 310 685 320 C 690 310 695 305 700 305 C 710 305 720 315 720 330 C 720 350 685 370 685 370 C 685 370 650 350 650 330 Z" fill="#f472b6" className="heart" style={{animationDelay: '0.6s'}} />
  </svg>
);

export const TabooBackground = () => (
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .rotating { animation: spin 8s linear infinite; transform-origin: center; }
        .shimmering { animation: shimmer 2s ease-in-out infinite; }
      `}</style>
      <linearGradient id="tabooGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f0f0f" stopOpacity="1" />
        <stop offset="100%" stopColor="#581c87" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#tabooGrad)" />
    <circle cx="600" cy="300" r="120" fill="none" stroke="#c084fc" strokeWidth="4" />
    <circle cx="600" cy="300" r="80" fill="#581c87" />
    <circle cx="600" cy="300" r="50" fill="#e9d5ff" className="shimmering" />
    <g className="rotating">
      <circle cx="600" cy="150" r="8" fill="#c084fc" />
      <circle cx="750" cy="325" r="8" fill="#c084fc" />
      <circle cx="600" cy="500" r="8" fill="#c084fc" />
      <circle cx="450" cy="325" r="8" fill="#c084fc" />
    </g>
    <circle cx="600" cy="300" r="140" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.4" className="shimmering" style={{animationDelay: '0.5s'}} />
    <circle cx="600" cy="300" r="160" fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.2" className="shimmering" style={{animationDelay: '1s'}} />
    <path d="M 300 600 L 330 650 L 270 650 Z" fill="#f472b6" opacity="0.5" />
    <path d="M 900 600 L 930 650 L 870 650 Z" fill="#f472b6" opacity="0.5" />
  </svg>
);

export const CommunityBackground = () => (
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 5px #10b981); }
          50% { filter: drop-shadow(0 0 15px #10b981); }
        }
        .floating { animation: float 3s ease-in-out infinite; }
        .glowing { animation: glow 2s ease-in-out infinite; }
      `}</style>
      <linearGradient id="communityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#064e3b" stopOpacity="1" />
        <stop offset="100%" stopColor="#059669" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#communityGrad)" />
    <circle cx="600" cy="350" r="100" fill="#10b981" opacity="0.8" className="glowing" />
    <circle cx="600" cy="350" r="80" fill="#d1fae5" opacity="0.6" />
    <circle cx="350" cy="200" r="40" fill="#6ee7b7" className="floating" />
    <circle cx="200" cy="400" r="40" fill="#6ee7b7" className="floating" style={{animationDelay: '0.5s'}} />
    <circle cx="350" cy="600" r="40" fill="#6ee7b7" className="floating" style={{animationDelay: '1s'}} />
    <circle cx="850" cy="600" r="40" fill="#6ee7b7" className="floating" style={{animationDelay: '1.5s'}} />
    <circle cx="1000" cy="400" r="40" fill="#6ee7b7" className="floating" style={{animationDelay: '1s'}} />
    <circle cx="850" cy="200" r="40" fill="#6ee7b7" className="floating" style={{animationDelay: '0.5s'}} />
    <line x1="350" y1="200" x2="600" y2="350" stroke="#10b981" strokeWidth="3" opacity="0.5" />
    <line x1="200" y1="400" x2="600" y2="350" stroke="#10b981" strokeWidth="3" opacity="0.5" />
    <line x1="350" y1="600" x2="600" y2="350" stroke="#10b981" strokeWidth="3" opacity="0.5" />
    <line x1="850" y1="600" x2="600" y2="350" stroke="#10b981" strokeWidth="3" opacity="0.5" />
    <line x1="1000" y1="400" x2="600" y2="350" stroke="#10b981" strokeWidth="3" opacity="0.5" />
    <line x1="850" y1="200" x2="600" y2="350" stroke="#10b981" strokeWidth="3" opacity="0.5" />
  </svg>
);

export const SecurityBackground = () => (
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes scan {
          0%, 100% { transform: translateY(-200px); }
          50% { transform: translateY(200px); }
        }
        .pulsing { animation: pulse 2s ease-in-out infinite; }
        .scanning { animation: scan 3s ease-in-out infinite; }
      `}</style>
      <linearGradient id="securityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1f2937" stopOpacity="1" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#securityGrad)" />
    <path d="M 600 150 L 800 250 L 800 500 Q 600 680 600 680 Q 400 500 400 250 Z" fill="#0ea5e9" opacity="0.3" className="pulsing" />
    <path d="M 600 200 L 750 280 L 750 480 Q 600 600 600 600 Q 450 480 450 280 Z" fill="none" stroke="#0ea5e9" strokeWidth="4" />
    <rect x="560" y="350" width="80" height="100" rx="5" fill="none" stroke="#38bdf8" strokeWidth="3" />
    <circle cx="600" cy="380" r="12" fill="none" stroke="#38bdf8" strokeWidth="3" />
    <path d="M 588 392 L 588 410 L 612 410 L 612 392" fill="none" stroke="#38bdf8" strokeWidth="3" />
    <line x1="450" y1="400" x2="750" y2="400" stroke="#38bdf8" strokeWidth="2" opacity="0.6" className="scanning" />
    <circle cx="300" cy="150" r="3" fill="#06b6d4" opacity="0.6" className="pulsing" />
    <circle cx="900" cy="200" r="3" fill="#06b6d4" opacity="0.6" className="pulsing" style={{animationDelay: '0.5s'}} />
    <circle cx="200" cy="650" r="3" fill="#06b6d4" opacity="0.6" className="pulsing" style={{animationDelay: '1s'}} />
    <circle cx="1000" cy="600" r="3" fill="#06b6d4" opacity="0.6" className="pulsing" style={{animationDelay: '1.5s'}} />
  </svg>
);

export const AnonymousBackground = () => (
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <style>{`
        @keyframes reveal {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
        .revealing { animation: reveal 3s ease-in-out infinite; }
        .flickering { animation: flicker 1.5s ease-in-out infinite; }
        .fading { animation: fadeInOut 4s ease-in-out infinite; }
      `}</style>
      <linearGradient id="anonymousGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a202c" stopOpacity="1" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#anonymousGrad)" />
    <circle cx="600" cy="300" r="100" fill="none" stroke="#a78bfa" strokeWidth="4" className="revealing" />
    <circle cx="570" cy="280" r="12" fill="#e9d5ff" className="flickering" />
    <circle cx="630" cy="280" r="12" fill="#e9d5ff" className="flickering" style={{animationDelay: '0.5s'}} />
    <path d="M 570 360 Q 600 380 630 360" fill="none" stroke="#a78bfa" strokeWidth="3" className="revealing" style={{animationDelay: '0.5s'}} />
    <text x="100" y="150" fontFamily="monospace" fontSize="24" fill="#6366f1" opacity="0.4" className="fading">01010101</text>
    <text x="1000" y="200" fontFamily="monospace" fontSize="24" fill="#6366f1" opacity="0.4" className="fading" style={{animationDelay: '1s'}}>10101010</text>
    <text x="150" y="650" fontFamily="monospace" fontSize="24" fill="#6366f1" opacity="0.4" className="fading" style={{animationDelay: '2s'}}>11001100</text>
    <text x="950" y="700" fontFamily="monospace" fontSize="24" fill="#6366f1" opacity="0.4" className="fading" style={{animationDelay: '1.5s'}}>01100110</text>
    <circle cx="250" cy="200" r="2" fill="#a78bfa" className="flickering" style={{animationDelay: '0.2s'}} />
    <circle cx="950" cy="350" r="2" fill="#a78bfa" className="flickering" style={{animationDelay: '0.5s'}} />
    <circle cx="300" cy="600" r="2" fill="#a78bfa" className="flickering" style={{animationDelay: '0.8s'}} />
    <circle cx="900" cy="550" r="2" fill="#a78bfa" className="flickering" style={{animationDelay: '1.1s'}} />
    <circle cx="600" cy="300" r="130" fill="none" stroke="#4f46e5" strokeWidth="1" opacity="0.3" className="fading" style={{animationDelay: '1s'}} />
    <circle cx="600" cy="300" r="160" fill="none" stroke="#4f46e5" strokeWidth="1" opacity="0.2" className="fading" style={{animationDelay: '2s'}} />
  </svg>
);
