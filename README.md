# AnoSUNU Frontend

Frontend React + Vite pour la plateforme sociale anonyme AnoSUNU.

## 🚀 Déploiement sur Vercel

Voir le guide complet : [DEPLOIEMENT_FRONTEND_VERCEL.md](../DEPLOIEMENT_FRONTEND_VERCEL.md)

## 📋 Configuration

### Variables d'Environnement (Vercel)

Dans Vercel Dashboard → Settings → Environment Variables, ajouter :

```env
VITE_API_URL=https://esimwawtelecom.com/anosunu/public
VITE_PUSHER_KEY=729c522f2a284c76caef
VITE_PUSHER_CLUSTER=eu
```

## 💻 Développement Local

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview
```

## 🎨 Optimisations Incluses

### Performance (71% réduction)
- ✅ Lucide React optimisé (930 KB économisés)
- ✅ Code splitting (Vite)
- ✅ Lazy loading routes
- ✅ Images WebP (57% réduction)
- ✅ React Query cache (API)
- ✅ Pusher lazy load

### Cache & Compression
- ✅ Service Worker (PWA)
- ✅ Gzip compression
- ✅ Cache headers optimisés

## 📦 Technologies

- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **React Router** (Routing)
- **React Query** (API cache)
- **Tailwind CSS** (Styling)
- **Pusher** (WebSocket temps réel)
- **PWA** (Progressive Web App)

## 🌐 Domaine

- **Production** : https://anosunu.com
- **API** : https://esimwawtelecom.com/anosunu/public

## 📱 PWA

L'application est installable sur mobile et desktop comme une app native.

## 🔧 Structure

```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages/routes
├── lib/           # Utils et config
│   ├── api.ts     # Client API
│   ├── icons.ts   # Icônes optimisées
│   ├── echo.ts    # WebSocket Pusher
│   └── queryClient.ts  # React Query
├── hooks/         # Custom hooks
└── types/         # Types TypeScript
```

## 🎯 Fonctionnalités

- Feed avec posts anonymes
- Chambres noires (publiques + privées)
- Paiement Wave intégré
- Messages temps réel (Pusher)
- Upload médias (images, vidéos, audio)
- PWA installable
- Dark mode (prévu V2)

## 📊 Bundle Size

Après optimisations :
- **Avant** : 4.80 MB
- **Après** : ~1.40 MB
- **Réduction** : 71%

## 🔐 Sécurité

- HTTPS obligatoire
- CORS configuré
- Tokens sécurisés
- Content Security Policy

## 📈 Performance

- **Lighthouse Score** : 90+
- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Core Web Vitals** : Vert
