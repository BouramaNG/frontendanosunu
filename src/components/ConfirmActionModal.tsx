import { Fragment } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, X } from '@/lib/icons';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subtitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneConfig: Record<NonNullable<ConfirmActionModalProps['tone']>, {
  container: string;
  accent: string;
  icon: typeof AlertTriangle;
}> = {
  danger: {
    container: 'bg-red-900/80 border-red-500/40 text-red-100',
    accent: 'bg-red-500/20 border-red-500/40 text-red-200',
    icon: AlertTriangle,
  },
  warning: {
    container: 'bg-amber-900/80 border-amber-500/40 text-amber-100',
    accent: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-indigo-900/80 border-indigo-500/40 text-indigo-100',
    accent: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200',
    icon: ShieldCheck,
  },
};

export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  subtitle,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!isOpen) {
    return null;
  }

  const { container, accent, icon: Icon } = toneConfig[tone];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${container} shadow-[0_50px_120px_-60px_rgba(248,113,113,0.65)]`}
      >
        <button
          type="button"
          onClick={loading ? undefined : onCancel}
          className="absolute right-4 top-4 rounded-full bg-black/30 p-1.5 text-white/70 transition hover:bg-black/40 hover:text-white"
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-6 p-6">
          <div className={`flex items-start gap-4 rounded-2xl border ${accent} p-4 backdrop-blur-xl`}>            
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">{title}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{message}</h2>
              {subtitle && (
                <p className="mt-2 text-xs leading-relaxed text-white/70">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={loading ? undefined : onCancel}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white sm:w-auto"
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={loading ? undefined : onConfirm}
              className={`w-full rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/40 transition hover:shadow-rose-500/60 sm:w-auto flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <Fragment>
                  <div className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                  <span>Traitement…</span>
                </Fragment>
              ) : (
                <Fragment>
                  <span>{confirmLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </Fragment>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
