import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Loader2 } from '@/lib/icons';
import { cn } from '../lib/utils';

const REPORT_REASON_VALUES = ['spam', 'hate', 'harassment', 'sexual', 'violence', 'other'] as const;

export type ReportReasonValue = typeof REPORT_REASON_VALUES[number];

export const REPORT_REASONS: Array<{
  value: ReportReasonValue;
  label: string;
  description: string;
}> = [
  {
    value: 'spam',
    label: 'Spam ou contenu promotionnel',
    description: 'Contenu indésirable, publicité non sollicitée, ou lien frauduleux.',
  },
  {
    value: 'hate',
    label: 'Discours haineux ou violence',
    description: 'Contenu incitant à la haine, discriminatoire ou menaçant.',
  },
  {
    value: 'harassment',
    label: 'Harcèlement ou intimidation',
    description: 'Attaques personnelles, intimidation, chantage ou humiliation.',
  },
  {
    value: 'sexual',
    label: 'Contenu inapproprié ou sexuel explicite',
    description: 'Contenu choquant, explicite ou inadapté à la communauté.',
  },
  {
    value: 'violence',
    label: 'Violence ou gore',
    description: 'Images ou descriptions graphiques choquantes.',
  },
  {
    value: 'other',
    label: 'Autre motif',
    description: 'Toute autre raison se justifiant, à préciser ci-dessous.',
  },
];

const reportSchema = z.object({
  reason: z.enum(['spam', 'hate', 'harassment', 'sexual', 'violence', 'other'] as const, {
    message: 'Veuillez sélectionner un motif.',
  }),
  details: z
    .string()
    .max(500, '500 caractères maximum.')
    .optional(),
});

export type ReportPostFormValues = z.infer<typeof reportSchema>;

interface ReportPostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ReportPostFormValues) => Promise<void>;
  loading?: boolean;
}

export default function ReportPostModal({ open, onClose, onSubmit, loading }: ReportPostModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReportPostFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: undefined,
      details: '',
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedReason = watch('reason');

  const handleClose = () => {
    if (!loading) {
      reset();
      setSubmitError(null);
      onClose();
    }
  };

  const internalSubmit = async (values: ReportPostFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
      reset();
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Impossible de soumettre le signalement.';
      setSubmitError(message);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="relative w-full max-w-lg mx-4 sm:mx-auto rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-rose-950/95 p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/60 hover:text-white hover:bg-white/20 transition"
          aria-label="Fermer"
        >
          ×
        </button>

        <div className="flex items-center gap-3 text-white mb-5">
          <div className="rounded-full bg-rose-500/20 p-2">
            <AlertTriangle className="h-5 w-5 text-rose-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Signaler cette publication</h2>
            <p className="text-sm text-white/60">
              Aidez-nous à maintenir la communauté sûre et bienveillante.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(internalSubmit)} className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white/80">Quel est le problème ?</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.value;
                return (
                  <label
                    key={reason.value}
                    className={cn(
                      'block cursor-pointer rounded-2xl border border-white/10 p-4 transition',
                      isSelected
                        ? 'bg-white/10 border-pink-400/40 shadow-[0_0_25px_rgba(236,72,153,0.25)]'
                        : 'hover:bg-white/5 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        value={reason.value}
                        className="mt-1 accent-pink-500"
                        {...register('reason')}
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">{reason.label}</p>
                        <p className="text-xs text-white/60">{reason.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.reason && <p className="text-xs text-rose-300">{errors.reason.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80" htmlFor="report-details">
              Commentaires supplémentaires (optionnel)
            </label>
            <textarea
              id="report-details"
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
              placeholder="Expliquez brièvement pourquoi cette publication pose problème..."
              {...register('details')}
            />
            {errors.details && <p className="text-xs text-rose-300">{errors.details.message}</p>}
          </div>

          {submitError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:border-white/40"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:from-pink-600 hover:to-purple-700 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{loading ? 'Envoi...' : 'Envoyer le signalement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
