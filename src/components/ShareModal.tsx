import { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Mail, Facebook, Twitter, Link as LinkIcon } from '@/lib/icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
  type?: 'post' | 'comment';
}

export default function ShareModal({ isOpen, onClose, title, text, url, type = 'post' }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [hasWebShare, setHasWebShare] = useState(false);

  useEffect(() => {
    // Vérifier si l'API Web Share est disponible
    setHasWebShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  const handleWebShare = async () => {
    if (!hasWebShare) return;

    try {
      await navigator.share({
        title,
        text: text.slice(0, 200),
        url,
      });
      onClose();
    } catch (error: any) {
      // L'utilisateur a annulé le partage, ne rien faire
      if (error.name !== 'AbortError') {
        // Erreur autre qu'annulation, fermer quand même le modal
        onClose();
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (error) {
      // Erreur silencieuse, ne pas afficher dans la console
    }
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(`${title}\n\n${text.slice(0, 200)}...\n\n${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    onClose();
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    onClose();
  };

  const shareToTwitter = () => {
    const tweetText = encodeURIComponent(`${title} ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    onClose();
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${text.slice(0, 500)}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Partager {type === 'post' ? 'le post' : 'le commentaire'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-white/80 line-clamp-3 mb-2">{text}</p>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <LinkIcon className="w-3 h-3" />
            <span className="truncate">{url}</span>
          </div>
        </div>

        {/* Options de partage */}
        <div className="space-y-3">
          {/* Web Share API (Mobile) */}
          {hasWebShare && (
            <button
              onClick={handleWebShare}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl hover:bg-green-500/30 transition text-white"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Partager via...</div>
                <div className="text-xs text-white/70">Applications disponibles sur votre appareil</div>
              </div>
            </button>
          )}

          {/* WhatsApp */}
          <button
            onClick={shareToWhatsApp}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">WhatsApp</div>
              <div className="text-xs text-white/60">Partager sur WhatsApp</div>
            </div>
          </button>

          {/* Facebook */}
          <button
            onClick={shareToFacebook}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white"
          >
            <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
              <Facebook className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">Facebook</div>
              <div className="text-xs text-white/60">Partager sur Facebook</div>
            </div>
          </button>

          {/* Twitter */}
          <button
            onClick={shareToTwitter}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white"
          >
            <div className="w-12 h-12 rounded-full bg-[#1DA1F2] flex items-center justify-center">
              <Twitter className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">Twitter / X</div>
              <div className="text-xs text-white/60">Partager sur Twitter</div>
            </div>
          </button>

          {/* Email */}
          <button
            onClick={shareToEmail}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">Email</div>
              <div className="text-xs text-white/60">Envoyer par email</div>
            </div>
          </button>

          {/* Copier le lien */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              copied ? 'bg-green-500' : 'bg-purple-500'
            }`}>
              {copied ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <Copy className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">{copied ? 'Lien copié !' : 'Copier le lien'}</div>
              <div className="text-xs text-white/60">
                {copied ? 'Le lien a été copié dans le presse-papiers' : 'Copier le lien dans le presse-papiers'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

