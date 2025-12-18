import { useState } from 'react';
import { X, CheckCircle2, Copy, ExternalLink, Loader2, AlertCircle } from '@/lib/icons';
import api from '../lib/api';

interface PayDunyaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    invoice_url: string;
    invoice_token: string;
    amount: number;
    isTestMode?: boolean;
  };
  onPaymentVerified: () => void;
}

export default function PayDunyaPaymentModal({
  isOpen,
  onClose,
  paymentData,
  onPaymentVerified,
}: PayDunyaPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/payments/paydunya/verify', {
        invoice_token: paymentData.invoice_token,
      });

      if (response.data.message) {
        if (response.data.data?.status === 'completed') {
          alert('✅ Paiement confirmé ! Votre abonnement est maintenant actif.');
          onPaymentVerified();
          setTimeout(() => {
            onClose();
          }, 2000);
        } else if (response.data.data?.status === 'pending') {
          alert('⏳ Votre paiement est en attente. Vous serez notifié dès qu\'il sera confirmé.');
        } else {
          alert('❌ Le paiement n\'a pas été confirmé. Veuillez réessayer.');
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-xl rounded-3xl border-2 border-white/20 max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {paymentData.isTestMode ? 'Mode Test - Abonnement' : 'Paiement PayDunya'}
          </h2>
          <p className="text-white/70">
            {paymentData.isTestMode 
              ? 'En mode test, l\'abonnement est déjà activé'
              : 'Effectuez votre paiement pour activer l\'abonnement'}
          </p>
        </div>

        {paymentData.isTestMode && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-blue-200 text-sm">
                <p className="font-semibold mb-1">Mode Test Activé</p>
                <p className="text-blue-200/80">
                  Votre abonnement est déjà actif. Vous pouvez accéder à la chambre maintenant.
                  En production, vous devrez effectuer le paiement via PayDunya.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/70">Montant</span>
            <span className="text-2xl font-bold text-white">
              {paymentData.amount.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/70">Token de facture</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-bold text-xs">{paymentData.invoice_token}</span>
              <button
                onClick={() => copyToClipboard(paymentData.invoice_token)}
                className="p-1 hover:bg-white/10 rounded transition"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/70" />
                )}
              </button>
            </div>
          </div>
        </div>

        {!paymentData.isTestMode && (
          <>
            {!paymentData.invoice_url && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="text-red-200 text-sm">
                    <p className="font-semibold mb-1">⚠️ Erreur</p>
                    <p className="text-red-200/80">
                      L'URL de paiement n'a pas pu être générée. Veuillez réessayer ou contacter le support.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {paymentData.invoice_url && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="text-yellow-200 text-sm">
                    <p className="font-semibold mb-1">💡 Comment payer</p>
                    <ul className="text-yellow-200/80 space-y-1 text-left list-disc list-inside">
                      <li>Cliquez sur "Ouvrir PayDunya" ci-dessous</li>
                      <li>Choisissez votre moyen de paiement (Orange Money, Wave, Free Money, Carte)</li>
                      <li>Effectuez le paiement</li>
                      <li>Vous serez automatiquement redirigé et votre abonnement sera activé</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {paymentData.isTestMode ? (
            <button
              onClick={() => {
                onPaymentVerified();
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Accéder à la Chambre
            </button>
          ) : (
            <>
              {paymentData.invoice_url ? (
                <a
                  href={paymentData.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Ouvrir PayDunya pour payer
                </a>
              ) : (
                <div className="w-full py-3 bg-gray-500/50 text-white/50 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  <AlertCircle className="w-5 h-5" />
                  URL de paiement non disponible
                </div>
              )}
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    J'ai déjà payé, vérifier
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

