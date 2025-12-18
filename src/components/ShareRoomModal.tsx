import { MessageCircle, Send, Mail, Share2, Copy, Check } from '@/lib/icons';
import { useState } from 'react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessCode: string;
  inviteLink: string;
  roomName: string;
}

export default function ShareRoomModal({
  isOpen,
  onClose,
  accessCode,
  inviteLink,
  roomName,
}: ShareRoomModalProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  if (!isOpen) return null;

  const shareText = `Rejoins-moi dans la chambre privée "${roomName}" sur Sama! 🎉`;
  const shareUrl = inviteLink || '';

  const handleCopy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleWhatsApp = () => {
    const message = `${shareText}\n\nCode: ${accessCode}\nOu clique ici: ${inviteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegram = () => {
    const message = `${shareText}\n\nCode: ${accessCode}\nOu clique ici: ${inviteLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleSMS = () => {
    const message = `${shareText} Code: ${accessCode} ${inviteLink}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const handleEmail = () => {
    const subject = `Rejoins-moi dans "${roomName}" sur Sama!`;
    const body = `${shareText}\n\nCode d'accès: ${accessCode}\n\nOu utilise ce lien: ${inviteLink}`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur">
      <div className="bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-2 border-purple-500/50 rounded-3xl max-w-md w-full max-h-screen overflow-y-auto p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Partager la chambre</h2>
          <p className="text-white/70">Invitez vos amis à rejoindre "{roomName}"</p>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl text-green-200 font-semibold transition"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm">WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegram}
            className="flex flex-col items-center gap-2 p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-xl text-blue-200 font-semibold transition"
          >
            <Send className="w-6 h-6" />
            <span className="text-sm">Telegram</span>
          </button>

          {/* SMS */}
          <button
            onClick={handleSMS}
            className="flex flex-col items-center gap-2 p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-purple-200 font-semibold transition"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-sm">SMS</span>
          </button>

          {/* Email */}
          <button
            onClick={handleEmail}
            className="flex flex-col items-center gap-2 p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-xl text-orange-200 font-semibold transition"
          >
            <Mail className="w-6 h-6" />
            <span className="text-sm">Email</span>
          </button>
        </div>

        {/* Manual Copy Options */}
        <div className="mb-6 border-t border-white/10 pt-6">
          <h3 className="text-white font-semibold mb-3">Ou copiez manuellement</h3>

          {/* Code */}
          <div className="mb-4">
            <label className="block text-white/70 text-sm font-semibold mb-2">Code d'accès</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/10">
                <div className="text-white font-mono text-lg font-bold">{accessCode}</div>
              </div>
              <button
                onClick={() => handleCopy(accessCode, 'code')}
                className="px-4 py-3 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50 rounded-lg text-white transition"
              >
                {copied === 'code' ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-2">Lien d'invitation</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/10 overflow-hidden">
                <div className="text-white/70 font-mono text-xs break-all">{inviteLink}</div>
              </div>
              <button
                onClick={() => handleCopy(inviteLink, 'link')}
                className="px-4 py-3 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50 rounded-lg text-white transition flex-shrink-0"
              >
                {copied === 'link' ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white font-semibold transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
