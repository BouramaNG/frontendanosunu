import { useEffect, useState } from 'react';

/**
 * Hook React pour détecter et notifier les mises à jour du Service Worker
 * 
 * Usage:
 *   const updateAvailable = useServiceWorkerUpdate();
 *   return updateAvailable ? <UpdateBanner /> : null;
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Vérifier si le navigateur supporte les service workers
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers non supportés');
      return;
    }

    // Écouter les changements de contrôleur (nouvelle version activée)
    const handleSWUpdate = () => {
      console.log('✅ Service Worker mis à jour - nouvelle version disponible');
      setUpdateAvailable(true);
    };

    // Event listener pour contrôleur change
    navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);

    // Vérifier les mises à jour périodiquement (toutes les minutes)
    const interval = setInterval(async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        registrations.forEach(reg => {
          reg.update();
        });
      } catch (error) {
        console.error('Erreur lors de la vérification SW:', error);
      }
    }, 60000); // 60 secondes

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
      clearInterval(interval);
    };
  }, []);

  return updateAvailable;
}
