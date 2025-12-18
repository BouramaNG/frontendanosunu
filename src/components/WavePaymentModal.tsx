import { useState, useEffect } from 'react';
import { X, CheckCircle2, ExternalLink, Loader2, AlertCircle, ArrowRight, Shield, Clock, HelpCircle } from '@/lib/icons';
import api from '../lib/api';

interface WavePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    payment_code: string;
    wave_url: string;
    amount: number;
    isTestMode?: boolean;
  };
  onPaymentVerified: (payload?: any) => void;
}

type Step = 'payment' | 'confirmation' | 'waiting';

const PHONE_PREFIXES = ['77', '78', '76', '70', '75'];

export default function WavePaymentModal({
  isOpen,
  onClose,
  paymentData,
  onPaymentVerified,
}: WavePaymentModalProps) {
  const [step, setStep] = useState<Step>('payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [phonePrefix, setPhonePrefix] = useState('77');
  const [phoneLast2, setPhoneLast2] = useState('');
  const [transactionLast4, setTransactionLast4] = useState('');
  const [actualAmountPaid, setActualAmountPaid] = useState(''); // NOUVEAU: montant réel payé
  
  // Status polling
  const [pollingStatus, setPollingStatus] = useState(false);

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setStep('payment');
      setError('');
      setPhonePrefix('77');
      setPhoneLast2('');
      setTransactionLast4('');
      setActualAmountPaid(''); // NOUVEAU
    }
  }, [isOpen]);

  // Poll for payment status when in waiting step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'waiting' && paymentData.payment_code) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/payments/wave/status/${paymentData.payment_code}`);
          if (response.data.data?.status === 'completed') {
            clearInterval(interval);
            // Pass the payment payload if server returned black_room
            onPaymentVerified(response.data.data ?? response.data);
          }
        } catch (error) {
          // Silently ignore polling errors
        }
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, paymentData.payment_code, onPaymentVerified]);

  if (!isOpen) return null;

  const handleSubmitConfirmation = async () => {
    // Validation
    if (!phoneLast2 || phoneLast2.length !== 2) {
      setError('Veuillez entrer les 2 derniers chiffres de votre numéro');
      return;
    }
    
    if (!/^\d{2}$/.test(phoneLast2)) {
      setError('Les 2 derniers chiffres doivent être des chiffres');
      return;
    }
    
    if (!transactionLast4 || transactionLast4.length !== 4) {
      setError('Veuillez entrer les 4 derniers caractères de la transaction');
      return;
    }

    // NOUVEAU: Valider le montant payé
    if (!actualAmountPaid) {
      setError('Veuillez entrer le montant payé');
      return;
    }

    const actualAmount = parseFloat(actualAmountPaid);
    if (isNaN(actualAmount) || actualAmount <= 0) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/payments/wave/confirm', {
        payment_code: paymentData.payment_code,
        phone_prefix: phonePrefix,
        phone_last2: phoneLast2,
        transaction_last4: transactionLast4.toUpperCase(),
        actual_amount_paid: actualAmount, // NOUVEAU: envoyer le montant
      });

      if (response.data.message) {
        setStep('waiting');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentStep = () => (
    <>
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <img 
            src="https://www.wave.com/img/wave-logo.svg" 
            alt="Wave" 
            className="w-12 h-12"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="text-4xl hidden">💳</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Paiement Wave
        </h2>
        <p className="text-white/70">
          Effectuez votre paiement pour activer l'abonnement
        </p>
      </div>

      {/* Amount Card */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-5 mb-5 border border-blue-400/30">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/80">Montant à payer</span>
          <span className="text-3xl font-bold text-white">
            {paymentData.amount?.toLocaleString() || '0'} <span className="text-lg">FCFA</span>
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/60">Code de paiement</span>
          <span className="text-white font-mono font-bold bg-white/10 px-3 py-1 rounded-lg">
            {paymentData.payment_code}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/5 rounded-2xl p-5 mb-5 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          Comment payer ?
        </h3>
        <ol className="space-y-3 text-white/80 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
            <span>Cliquez sur <strong className="text-blue-300">"Ouvrir Wave"</strong> ci-dessous</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold">2</span>
            <span>Scannez le QR code avec l'application Wave</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold">3</span>
            <span>Payez le montant de <strong className="text-green-300 text-lg">{paymentData.amount?.toLocaleString()} FCFA</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold">4</span>
            <span>Validez le paiement</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold">5</span>
            <span>Gardez votre <strong className="text-yellow-300">reçu Wave</strong> (vous aurez besoin de l'ID de transaction)</span>
          </li>
        </ol>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <a
          href={paymentData.wave_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
        >
          <ExternalLink className="w-5 h-5" />
          Ouvrir Wave
        </a>
        <button
          onClick={() => setStep('confirmation')}
          className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20 flex items-center justify-center gap-2"
        >
          J'ai déjà payé
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Confirmer le paiement
        </h2>
        <p className="text-white/70 text-sm">
          Entrez les informations de votre reçu Wave pour confirmer
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-green-200 text-sm">
            <p className="font-semibold mb-1">🔒 Votre anonymat est préservé</p>
            <p className="text-green-200/80">
              Seuls le préfixe et les 2 derniers chiffres sont demandés. 
              Votre numéro complet n'est <strong>jamais enregistré</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Masked Phone Input */}
      <div className="mb-5">
        <label className="block text-white/80 text-sm font-medium mb-2">
          📱 Votre numéro Wave (masqué)
        </label>
        <div className="flex items-center gap-2">
          <select
            value={phonePrefix}
            onChange={(e) => setPhonePrefix(e.target.value)}
            className="w-20 py-3 px-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {PHONE_PREFIXES.map(prefix => (
              <option key={prefix} value={prefix} className="bg-gray-800">{prefix}</option>
            ))}
          </select>
          
          <div className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white/40 text-center font-mono">
            XXX XX
          </div>
          
          <input
            type="text"
            maxLength={2}
            value={phoneLast2}
            onChange={(e) => setPhoneLast2(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="33"
            className="w-20 py-3 px-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-center placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-white/50 text-xs mt-2">
          Exemple: Si votre numéro est 77 312 45 33, entrez 77 et 33
        </p>
      </div>

      {/* Transaction Last 4 Input */}
      <div className="mb-5">
        <label className="block text-white/80 text-sm font-medium mb-2">
          🔐 Les 4 derniers caractères de l'ID de transaction
        </label>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
          <p className="text-white/60 text-xs mb-2">Sur votre reçu Wave, l'ID ressemble à :</p>
          <div className="font-mono text-white bg-white/10 rounded-lg p-3 text-center">
            <span className="text-white/40">T56KZERAMIF</span>
            <span className="text-yellow-400 font-bold border-b-2 border-yellow-400">QGKT</span>
            <span className="text-white/40">-NU</span>
          </div>
          <p className="text-white/50 text-xs mt-2 text-center">
            ↑ Entrez ces 4 caractères (avant le tiret)
          </p>
        </div>
        
        <input
          type="text"
          maxLength={4}
          value={transactionLast4}
          onChange={(e) => setTransactionLast4(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="QGKT"
          className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-white font-mono font-bold text-center text-xl tracking-widest placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
        />
      </div>

      {/* Amount Paid Input - NOUVEAU */}
      <div className="mb-5">
        <label className="block text-white/80 text-sm font-medium mb-2">
          💰 Montant exact payé (FCFA)
        </label>
        
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-3">
          <p className="text-amber-200/80 text-xs">
            ⚠️ <strong>Important:</strong> Vérifiez que le montant payé correspond exactement à <strong>{paymentData.amount?.toLocaleString() || '0'} FCFA</strong>. 
            Si vous avez payé un montant différent, votre transaction sera rejetée.
          </p>
        </div>
        
        <input
          type="number"
          value={actualAmountPaid}
          onChange={(e) => setActualAmountPaid(e.target.value)}
          placeholder={paymentData.amount?.toString() || '0'}
          className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-center placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-white/50 text-xs mt-2 text-center">
          Entrez le montant exactement comme apparaît sur votre reçu Wave
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSubmitConfirmation}
          disabled={loading || phoneLast2.length !== 2 || transactionLast4.length !== 4}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Vérification...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Confirmer mon paiement
            </>
          )}
        </button>
        <button
          onClick={() => setStep('payment')}
          className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20"
        >
          ← Retour aux instructions
        </button>
      </div>
    </>
  );

  const renderWaitingStep = () => (
    <>
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
          <Clock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          En cours de vérification
        </h2>
        <p className="text-white/70">
          Votre confirmation a été enregistrée
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-5 mb-5 border border-yellow-400/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-yellow-300 animate-spin" />
          </div>
          <div>
            <p className="text-white font-semibold">Vérification en cours</p>
            <p className="text-white/60 text-sm">Un administrateur va valider votre paiement</p>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-white/60">Code de paiement</span>
            <span className="text-white font-mono font-bold">{paymentData.payment_code}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-white/60">Numéro masqué</span>
            <span className="text-white font-mono">{phonePrefix} XXX XX {phoneLast2}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Transaction (4 derniers)</span>
            <span className="text-white font-mono font-bold">{transactionLast4}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-blue-200 text-sm">
            <p className="font-semibold mb-1">⏱️ Temps d'attente estimé</p>
            <p className="text-blue-200/80">
              Généralement <strong>moins de 30 minutes</strong> pendant les heures ouvrables. 
              Vous recevrez une notification dans l'application une fois votre abonnement activé.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh hint */}
      <p className="text-white/50 text-xs text-center mb-4">
        Cette page vérifie automatiquement le statut de votre paiement...
      </p>

      <button
        onClick={onClose}
        className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20"
      >
        Fermer et attendre
      </button>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 lg:pb-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 backdrop-blur-xl rounded-3xl border-2 border-white/20 max-w-md w-full mx-4 sm:mx-auto p-4 sm:p-6 relative max-h-[calc(100vh-8rem)] lg:max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {paymentData.isTestMode ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Mode Test</h2>
              <p className="text-white/70">L'abonnement est déjà activé</p>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="text-blue-200 text-sm">
                  <p className="font-semibold mb-1">Mode Test Activé</p>
                  <p className="text-blue-200/80">
                    En production, vous devrez effectuer le paiement via Wave.
                  </p>
                </div>
              </div>
            </div>
            
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
          </>
        ) : (
          <>
            {step === 'payment' && renderPaymentStep()}
            {step === 'confirmation' && renderConfirmationStep()}
            {step === 'waiting' && renderWaitingStep()}
          </>
        )}
      </div>
    </div>
  );
}
