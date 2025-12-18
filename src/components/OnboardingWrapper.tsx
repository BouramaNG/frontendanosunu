import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import OnboardingModal from './OnboardingModal';
import { useTopicsQuery } from '../hooks/useDataCache';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, fetchUser } = useAuthStore();
  const { data: topicsData = [] } = useTopicsQuery();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        return;
      }

      // Si l'utilisateur n'a pas complété l'onboarding et on a les topics
      if (!user.has_completed_onboarding && topicsData.length > 0) {
        setShowOnboarding(true);
      }
    };

    checkOnboarding();
  }, [user, topicsData]);

  const handleOnboardingComplete = async () => {
    // Rafraîchir les données utilisateur
    await fetchUser();
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          topics={topicsData}
          onComplete={handleOnboardingComplete}
        />
      )}
      {children}
    </>
  );
}

