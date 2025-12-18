import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import Layout from './components/Layout';
import OnboardingWrapper from './components/OnboardingWrapper';
import PinReminderModal from './components/PinReminderModal';
import SetPinModal from './components/SetPinModal';

// Chargement immédiat pour les pages critiques (Login, Register, Home)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy loading pour toutes les autres pages (réduit le bundle initial de ~70%)
const FeedNew = lazy(() => import('./pages/FeedNew'));
const Moderation = lazy(() => import('./pages/Moderation'));
const DevenirModerateur = lazy(() => import('./pages/DevenirModerateur'));
const AdminModeration = lazy(() => import('./pages/AdminModeration'));
const AnonymousAdmin = lazy(() => import('./pages/AnonymousAdmin'));
const AdminBlackRooms = lazy(() => import('./pages/AdminBlackRooms'));
const Followers = lazy(() => import('./pages/Followers'));
const ChambresNoires = lazy(() => import('./pages/ChambresNoires'));
const BlackRoomDetail = lazy(() => import('./pages/BlackRoomDetail'));
const CreatePrivateRoom = lazy(() => import('./pages/CreatePrivateRoom'));
const JoinPrivateRoom = lazy(() => import('./pages/JoinPrivateRoom'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const AdminActivation = lazy(() => import('./pages/AdminActivation'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [grace, setGrace] = useState(true);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('auth_token'));
    if (!hasToken) {
      setGrace(false);
      return;
    }
    // Give fetchUser + retry a slightly larger window before deciding to redirect
    const id = window.setTimeout(() => setGrace(false), 1500);
    return () => clearTimeout(id);
  }, []);

  if (isLoading || grace) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const user = useAuthStore((state) => state.user);
  const pinReminderVisible = useAuthStore((state) => state.pinReminderVisible);
  const initializePinReminder = useAuthStore((state) => state.initializePinReminder);
  const remindPinLater = useAuthStore((state) => state.remindPinLater);
  const cancelPinReminder = useAuthStore((state) => state.cancelPinReminder);
  const [showSetPinModal, setShowSetPinModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!user) {
      cancelPinReminder();
      return;
    }

    if (user.has_keychain_pin) {
      cancelPinReminder();
    } else {
      initializePinReminder();
    }
  }, [user, cancelPinReminder, initializePinReminder]);

  const handleOpenSetPin = () => {
    cancelPinReminder();
    setShowSetPinModal(true);
  };

  const handleCloseSetPin = () => {
    setShowSetPinModal(false);
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.has_keychain_pin) {
      remindPinLater();
    }
  };

  // Composant de chargement pour les pages lazy
  const PageLoader = () => (
    <div className="flex justify-center items-center min-h-screen bg-gradient-main">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
    </div>
  );

  const updateAvailable = useServiceWorkerUpdate();

  return (
    <QueryClientProvider client={queryClient}>
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-base">✨ Nouvelle version disponible!</p>
              <p className="text-sm opacity-90 mt-1">Rafraîchissez pour obtenir les dernières mises à jour et améliorations.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="whitespace-nowrap bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      )}
      <Router>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <OnboardingWrapper>
                      <FeedNew />
                    </OnboardingWrapper>
                  </ProtectedRoute>
                }
              />
            <Route
              path="/followers"
              element={
                <ProtectedRoute>
                  <Followers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chambres-noires"
              element={
                <ProtectedRoute>
                  <ChambresNoires />
                </ProtectedRoute>
              }
            />
            <Route
              path="/black-rooms/:slug"
              element={
                <ProtectedRoute>
                  <BlackRoomDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-private-room"
              element={
                <ProtectedRoute>
                  <CreatePrivateRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-private-room"
              element={
                <ProtectedRoute>
                  <JoinPrivateRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/black-rooms"
              element={
                <ProtectedRoute>
                  <AdminBlackRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderation"
              element={
                <ProtectedRoute>
                  <Moderation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devenir-moderateur"
              element={
                <ProtectedRoute>
                  <DevenirModerateur />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute>
                  <AdminModeration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/anonymous"
              element={
                <ProtectedRoute>
                  <AnonymousAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activation"
              element={
                <ProtectedRoute>
                  <AdminActivation />
                </ProtectedRoute>
              }
            />
          </Routes>
          </Suspense>
          <PinReminderModal
            isOpen={pinReminderVisible}
            onCreatePin={handleOpenSetPin}
            onLater={remindPinLater}
          />
          <SetPinModal isOpen={showSetPinModal} onClose={handleCloseSetPin} />
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
