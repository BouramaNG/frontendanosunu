/**
 * Protection anti-téléchargement et anti-capture
 */

// Détecter les tentatives de capture d'écran (partiel sur web)
export function detectScreenCapture(): void {
  // Détecter les raccourcis clavier
  document.addEventListener('keydown', (e) => {
    // Print Screen
    if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
      e.preventDefault();
      showCaptureWarning();
    }
  });

  // Détecter les outils de capture (partiel)
  document.addEventListener('contextmenu', (e) => {
    // Empêcher le clic droit sur les images/vidéos
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      e.preventDefault();
      showCaptureWarning();
    }
  });

  // Détecter les tentatives de drag & drop (téléchargement)
  document.addEventListener('dragstart', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      e.preventDefault();
      showCaptureWarning();
    }
  });
}

// Afficher un avertissement
function showCaptureWarning(): void {
  const warning = document.createElement('div');
  warning.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
  warning.textContent = '⚠️ Capture d\'écran détectée !';
  document.body.appendChild(warning);

  setTimeout(() => {
    warning.remove();
  }, 3000);
}

// Empêcher le téléchargement d'images
export function preventImageDownload(): void {
  // Désactiver le clic droit
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      e.preventDefault();
      return false;
    }
  }, false);

  // Empêcher le drag & drop
  document.addEventListener('dragstart', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      e.preventDefault();
      return false;
    }
  }, false);
}

// Ajouter un overlay de protection sur les images/vidéos
export function addProtectionOverlay(element: HTMLElement): void {
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  element.style.pointerEvents = 'none'; // Empêcher les interactions directes
  
  // Ajouter un overlay transparent
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-transparent z-10';
  overlay.style.pointerEvents = 'auto';
  
  if (element.parentElement) {
    element.parentElement.style.position = 'relative';
    element.parentElement.appendChild(overlay);
  }
}

// Détecter les tentatives de capture vidéo (partiel)
export function detectVideoCapture(videoElement: HTMLVideoElement): void {
  // Désactiver les contrôles de téléchargement
  videoElement.controlsList.add('nodownload');
  videoElement.controlsList.add('noremoteplayback');
  
  // Empêcher le clic droit
  videoElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showCaptureWarning();
  });

  // Détecter les tentatives de capture de frame
  videoElement.addEventListener('seeked', () => {
    // Logique de détection (basique)
    console.warn('Tentative de navigation dans la vidéo détectée');
  });
}

// Watermarking côté client (optionnel, en plus du serveur)
export function addClientWatermark(canvas: HTMLCanvasElement, userId: string, sessionId: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const watermark = generateWatermark(userId, sessionId);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(watermark, canvas.width / 2, canvas.height / 2);
}

function generateWatermark(userId: string, sessionId: string): string {
  const hash = btoa(userId + sessionId + Date.now().toString());
  return hash.substring(0, 16);
}

