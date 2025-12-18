/**
 * Utilitaire pour jouer un son de notification
 * Utilise l'API Web Audio pour générer un son agréable sans fichier externe
 */

let audioContext: AudioContext | null = null;

/**
 * Initialise le contexte audio (nécessaire pour jouer des sons)
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('[NotificationSound] Impossible d\'initialiser le contexte audio:', error);
      return null;
    }
  }

  // Si le contexte est suspendu (certains navigateurs), le reprendre
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch((error) => {
      console.warn('[NotificationSound] Impossible de reprendre le contexte audio:', error);
    });
  }

  return audioContext;
}

/**
 * Génère et joue un son de notification agréable
 * Son doux et discret pour ne pas être intrusif
 */
export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  try {
    // Créer un oscillateur pour générer le son
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connecter les nœuds
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configuration du son : deux notes douces
    const frequency1 = 800; // Fréquence de base (Hz)
    const frequency2 = 1000; // Deuxième note légèrement plus haute

    // Première note
    oscillator.frequency.setValueAtTime(frequency1, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency2, ctx.currentTime + 0.1);

    // Type d'onde : sine pour un son doux
    oscillator.type = 'sine';

    // Enveloppe ADSR (Attack, Decay, Sustain, Release) pour un son naturel
    const now = ctx.currentTime;
    const duration = 0.15; // Durée totale du son (150ms)

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack rapide
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05); // Decay
    gainNode.gain.linearRampToValueAtTime(0.1, now + duration - 0.05); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release

    // Démarrer et arrêter le son
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    console.warn('[NotificationSound] Erreur lors de la lecture du son:', error);
  }
}

/**
 * Vérifie si les sons sont activés (peut être étendu avec des préférences utilisateur)
 */
export function isSoundEnabled(): boolean {
  // Pour l'instant, toujours activé
  // Peut être étendu pour vérifier les préférences utilisateur
  return true;
}

