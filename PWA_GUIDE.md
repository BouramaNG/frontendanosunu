# Guide PWA - Anosunu

## ✅ Configuration terminée

Votre application est maintenant une **Progressive Web App (PWA)** !

## 🎯 Fonctionnalités PWA activées

### 1. **Installation sur l'écran d'accueil**
- Sur mobile : Un bouton "Ajouter à l'écran d'accueil" apparaîtra automatiquement
- Sur desktop : Icône d'installation dans la barre d'adresse du navigateur

### 2. **Mode hors ligne**
- L'application peut fonctionner sans connexion internet
- Les fichiers JS, CSS, images sont mis en cache
- Les API sont en cache pendant 5 minutes

### 3. **Cache intelligent**
- **Polices Google** : Cache pendant 1 an
- **Images** : Cache pendant 30 jours (max 50 images)
- **API** : NetworkFirst avec fallback cache (5 min)

### 4. **Expérience native**
- Fonctionne en plein écran (sans barre de navigation)
- Icône d'application sur l'écran d'accueil
- Splash screen au lancement
- Couleur de thème : Rose (#ec4899)

## 📱 Comment installer l'application

### Sur Android (Chrome/Edge)
1. Ouvrez l'application dans Chrome
2. Appuyez sur le menu (3 points) → "Installer l'application"
3. L'icône Anosunu apparaîtra sur votre écran d'accueil

### Sur iOS (Safari)
1. Ouvrez l'application dans Safari
2. Appuyez sur le bouton Partager (icône carrée avec flèche)
3. Sélectionnez "Sur l'écran d'accueil"
4. Appuyez sur "Ajouter"

### Sur Desktop (Chrome/Edge)
1. Ouvrez l'application
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Cliquez sur "Installer"

## 🔧 Personnalisation

### Changer les icônes

Remplacez ces fichiers dans `public/` :
- `pwa-192x192.png` - Icône 192x192 pixels
- `pwa-512x512.png` - Icône 512x512 pixels

**Recommandations** :
- Format PNG avec fond transparent ou couleur unie
- Design simple et reconnaissable
- Éviter les petits détails (illisibles à petite taille)

### Modifier les couleurs

Dans `vite.config.ts` :
```typescript
manifest: {
  theme_color: '#ec4899',        // Couleur de la barre d'état
  background_color: '#1f2937',   // Couleur de fond du splash screen
}
```

### Changer le nom de l'application

Dans `vite.config.ts` :
```typescript
manifest: {
  name: 'Anosunu - Plateforme Anonyme',  // Nom complet
  short_name: 'Anosunu',                 // Nom court (< 12 caractères)
}
```

## 🚀 Mise en production

### Build de production
```bash
cd frontend_anonymous
npm run build
```

Cela générera :
- `/dist` - Fichiers statiques optimisés
- `/dist/sw.js` - Service Worker
- `/dist/manifest.webmanifest` - Manifeste PWA

### Déploiement

**Important** : Une PWA nécessite HTTPS en production !

Servez les fichiers `/dist` avec un serveur web (Nginx, Apache, etc.)

Exemple Nginx :
```nginx
location / {
  try_files $uri $uri/ /index.html;
  add_header Cache-Control "no-cache";
}

location /assets {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## 🔍 Tester la PWA

### Vérifier le Service Worker
1. Ouvrez DevTools (F12)
2. Onglet "Application" → "Service Workers"
3. Vous devriez voir un SW actif

### Tester le mode hors ligne
1. Ouvrez DevTools (F12)
2. Onglet "Network" → Cochez "Offline"
3. Rechargez la page → L'app devrait toujours fonctionner

### Audit PWA
1. Ouvrez DevTools (F12)
2. Onglet "Lighthouse"
3. Cochez "Progressive Web App"
4. Cliquez "Generate report"

## 📦 Ce qui est inclus

- ✅ Service Worker auto-généré
- ✅ Manifest PWA
- ✅ Cache des assets statiques
- ✅ Cache des polices Google
- ✅ Cache des images
- ✅ Cache API avec NetworkFirst
- ✅ Meta tags pour iOS/Android
- ✅ Auto-update du SW

## 🆘 Dépannage

### L'icône d'installation n'apparaît pas
- Vérifiez que vous êtes en HTTPS (ou localhost)
- Vérifiez que le manifest est valide (DevTools → Application → Manifest)
- Rechargez la page (Ctrl+Shift+R)

### Le Service Worker ne s'active pas
- Supprimez l'ancien SW (DevTools → Application → Service Workers → Unregister)
- Videz le cache (DevTools → Application → Storage → Clear site data)
- Rechargez la page

### Les modifications ne s'affichent pas
Le Service Worker cache les fichiers. Pour forcer la mise à jour :
- Mode dev : `devOptions.enabled: true` déjà activé (pas de cache)
- Mode prod : Le SW se met à jour automatiquement au prochain chargement

## 📚 Documentation

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
