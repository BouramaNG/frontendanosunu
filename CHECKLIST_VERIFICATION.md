# ✅ CHECKLIST DE VÉRIFICATION - FEED REDESIGN

## 📋 Installation & Compilation

### Frontend
- [ ] `npm install` - Dépendances installées
- [ ] `npm run build` - Build réussit sans erreur
- [ ] `npm run dev` - Dev server démarre sur http://localhost:5173
- [ ] Console ne montre pas d'erreurs TypeScript

### Backend
- [ ] `composer install` - Dépendances installées
- [ ] `php artisan serve` - Serveur démarre sur http://localhost:8000
- [ ] Base de données migée (`php artisan migrate`)
- [ ] Données de test chargées (`php artisan db:seed`)

---

## 🎨 Vérification Visuelle - PostCard

### Header
- [ ] Avatar circulaire avec couleur/emoji visible
- [ ] Nom d'utilisateur affiché (ou "Anonyme")
- [ ] Badge de rôle (✅ Modérateur / Admin) visible si applicable
- [ ] Timestamp relatif affiché (ex: "il y a 2h")
- [ ] Catégorie affichée (ex: "Politique")
- [ ] Menu 3 points (⋯) visible et cliquable

### Contenu
- [ ] Texte du post s'affiche correctement
- [ ] Retours à la ligne respectés
- [ ] Images s'affichent en grille responsive
- [ ] Emojis/stickers s'affichent
- [ ] Post bloqué = message grisé si applicable

### Actions
- [ ] ❤️ Bouton Like visible
- [ ] Compteur de likes s'affiche
- [ ] 💬 Bouton Commentaires visible
- [ ] Compteur de commentaires s'affiche
- [ ] 🔗 Bouton Partager visible (si implémenté)
- [ ] Espacement correct entre boutons

### Menu (⋯)
- [ ] Dropdown s'ouvre au clic
- [ ] Options visibles: Signaler, Bloquer (mod)
- [ ] Si propriétaire: option Supprimer visible
- [ ] Clic en dehors ferme le menu

---

## 🎨 Vérification Visuelle - PostForm

### Header
- [ ] Avatar utilisateur affiché en haut
- [ ] Nom utilisateur affiché
- [ ] Texte de placeholder "Partagez vos pensées..."

### Sélecteur Catégorie
- [ ] Dropdown "Catégorie" visible
- [ ] Toutes les catégories listées
- [ ] Sélection fonctionne

### Textarea
- [ ] Grande zone de texte visible
- [ ] Placeholder "Exprimez-vous sans crainte..."
- [ ] Hauteur par défaut = 4 lignes
- [ ] Texte reste lisible

### Compteur Caractères
- [ ] Barre de progression visible sous le textarea
- [ ] Affiche "0/1000" initialement
- [ ] Barre mauve < 80%
- [ ] Barre jaune = 80-99%
- [ ] Barre rouge = >= 100%
- [ ] Bouton Publier désactivé si > 1000 caractères

### Upload Images
- [ ] Zone drag & drop visible
- [ ] Bordure pointillée autour
- [ ] Texte "Glissez/déposez"
- [ ] Clic ouvre file picker
- [ ] Drag & drop fonctionne
- [ ] Images ajoutées = preview affichée
- [ ] Bouton X sur chaque image pour supprimer

### Boutons d'Action
- [ ] Bouton Image (📷) visible
- [ ] Bouton Mic (🎤) visible
- [ ] Bouton Publier (Send) visible et actif
- [ ] Bouton Publier se désactive si pas de contenu

---

## 💬 Vérification Visuelle - Commentaires

### Affichage Commentaires
- [ ] Section commentaires s'affiche sous le post au clic
- [ ] Chaque commentaire a: avatar, nom, timestamp
- [ ] Contenu commentaire affiché
- [ ] Système de likes sur commentaires
- [ ] Boutons Répondre visibles

### Arborescence
- [ ] Réponses indentées sous le commentaire parent
- [ ] "Voir X réponses" pliable/dépliable
- [ ] Indentation progressive (depth)
- [ ] Bordure vertical gauche pour imbrication

### Actions Commentaires
- [ ] ❤️ Like commentaire
- [ ] 💬 Bouton Répondre
- [ ] Menu d'options (signaler, supprimer si proprio)

---

## 🔄 Vérification Fonctionnelle

### Interactions Post
- [ ] Click Like = cœur remplit + compteur +1
- [ ] Click Like à nouveau = cœur vide + compteur -1
- [ ] Click Commentaires = section se déploie
- [ ] Clic à nouveau = section se replie
- [ ] Chargement commentaires montre spinner

### Interactions Formulaire
- [ ] Saisir du texte = mise à jour du compteur
- [ ] Dépasser 1000 caractères = bouton désactivé
- [ ] Ajouter image = preview apparaît
- [ ] Cliquer Publier = modal succès
- [ ] Post apparaît en haut du feed

### Modération (Si Admin/Modérateur)
- [ ] Menu d'action pour modérateur visible
- [ ] Clic Bloquer = post grisé + message
- [ ] Clic Débloquer = post normal à nouveau
- [ ] Clic Supprimer = confirmation modal

### Signalement
- [ ] Clic Signaler = modal de signalement
- [ ] Sélection raison = obligatoire
- [ ] Ajout détails = optionnel
- [ ] Validation fonctionne

---

## 📱 Vérification Responsive

### Mobile (360px - 640px)
- [ ] Layout est en colonne simple
- [ ] Boutons sont compacts mais cliquables
- [ ] Images s'affichent en 1 colonne
- [ ] Texte lisible sans zoom
- [ ] Menu ne couvre pas le contenu
- [ ] Pas de scrolling horizontal

### Tablet (768px - 1024px)
- [ ] Sidebar catégories optionnelle
- [ ] Post card largeur adaptée
- [ ] Images en 2 colonnes si 2+ images
- [ ] Espacement logique

### Desktop (1200px+)
- [ ] Post cards centrées (max-w-2xl)
- [ ] Toutes les fonctionnalités visibles
- [ ] Bonne lisibilité du contenu
- [ ] Hover effects visibles

---

## ⚡ Vérification Performance

- [ ] Page charge en < 2s
- [ ] Pas de lag au scroller
- [ ] Like/Unlike < 500ms
- [ ] Ouvrir commentaires < 800ms
- [ ] Ajouter image < 1s
- [ ] Console: Pas de warnings majeurs

---

## 🐛 Vérification Erreurs

### Console (F12 → Console)
- [ ] Pas d'erreurs TypeScript rouge
- [ ] Pas d'erreurs 404
- [ ] Pas d'erreurs API significatives
- [ ] Warnings acceptables uniquement

### Network (F12 → Network)
- [ ] Appels API -> 200 OK
- [ ] Images chargent correctement
- [ ] Pas de timeout requests
- [ ] Pas de CORS errors

### Styled (F12 → Styles)
- [ ] Tailwind classes appliquées correctement
- [ ] Pas de overflow/layout issues
- [ ] Animations fluides

---

## 🔐 Vérification Sécurité

- [ ] Authentication requise pour feed
- [ ] Token dans localStorage sécurisé
- [ ] Pas de credentials en hardcode
- [ ] Modération API-side validée
- [ ] Signalement sauvegardé DB

---

## 📊 Vérification État

### Data Flow
- [ ] Posts chargent depuis API
- [ ] Likes se synchronisent
- [ ] Commentaires chargent on-demand
- [ ] Suppression = update UI immédiatement
- [ ] Erreur = modal affichée

### State Management
- [ ] Zustand auth store fonctionne
- [ ] Likes gérés localement
- [ ] Commentaires cachés par défaut
- [ ] Pas de state leak

---

## 🎯 Final Checks

### Code Quality
- [ ] Pas d'erreurs TypeScript
- [ ] Pas de console.log debug
- [ ] Imports non-utilisés supprimés
- [ ] Code formaté correctement

### Documentation
- [ ] README.md mis à jour
- [ ] REFONTE_FEED.md complété
- [ ] FEED_START_GUIDE.md clair
- [ ] Commentaires code essentiels

### Deployment Ready
- [ ] Pas de breaking changes
- [ ] Ancien Feed.tsx gardé en backup
- [ ] FeedNew.tsx testé à 100%
- [ ] Rollback possible si besoin

---

## 📋 Sign-Off

```
Frontend Build:     ✅ PASS
Visual Design:      ✅ PASS
Functionality:      ✅ PASS
Responsiveness:     ✅ PASS
Performance:        ✅ PASS
Security:           ✅ PASS
Documentation:      ✅ PASS
─────────────────────────────
OVERALL:            ✅ READY FOR PRODUCTION
```

---

## 🚀 Deployment Steps

1. [ ] Testez localement completement
2. [ ] Verifiez tous les checkboxes ci-dessus
3. [ ] Committez sur git avec message clair
4. [ ] Push vers la branche principale
5. [ ] Déployez sur serveur production
6. [ ] Testez sur production
7. [ ] Monitorez pour erreurs
8. [ ] Communiquez changements aux users

---

**🎉 Si tous les checks passent = VOUS ÊTES PRÊT!**
