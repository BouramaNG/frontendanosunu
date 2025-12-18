import { useState } from 'react';
import { AlertTriangle, Check, AlertCircle, Trash2, Ban } from '@/lib/icons';

interface ReportedPost {
  id: number;
  content: string;
  author: string;
  topic: string;
  reports: number;
  reason: string;
  timestamp: string;
}

export default function Moderation() {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([
    {
      id: 1,
      content: "Je pense vraiment que certaines personnes ne méritent pas de vivre dans notre société...",
      author: "politique",
      topic: "Politique",
      reports: 12,
      reason: "Contenu haineux - Plusieurs utilisateurs",
      timestamp: "il y a 30 minutes"
    },
    {
      id: 2,
      content: "Mon ex-mari vraiment qu'on lui fasse du mal pour ce qu'il a fait...",
      author: "mariage",
      topic: "Mariage",
      reports: 8,
      reason: "Menace - Plusieurs utilisateurs",
      timestamp: "il y a 2 heures"
    },
    {
      id: 3,
      content: "Quelqu'un sait où je peux me procurer des substances illégales ?",
      author: "tabou",
      topic: "Sujets Tabous",
      reports: 5,
      reason: "Utilisation anonyme",
      timestamp: "il y a 3 heures"
    }
  ]);

  const handleApprove = (postId: number) => {
    setReportedPosts(posts => posts.filter(p => p.id !== postId));
  };

  const handleWarn = (postId: number) => {
    setReportedPosts(posts => posts.filter(p => p.id !== postId));
  };

  const handleDelete = (postId: number) => {
    setReportedPosts(posts => posts.filter(p => p.id !== postId));
  };

  const handleBan = (postId: number) => {
    setReportedPosts(posts => posts.filter(p => p.id !== postId));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg"></div>
            <h1 className="text-2xl font-bold text-white">Modération AnonExpress</h1>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm font-medium border border-orange-500/30">
              Modérateur actif
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex space-x-4">
            <div className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
              <span className="text-sm font-medium">🚨 Signalements (3)</span>
            </div>
            <div className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
              <span className="text-sm font-medium">👥 Candidatures Modérateurs (2)</span>
            </div>
            <div className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
              <span className="text-sm font-medium">📊 Statistiques</span>
            </div>
          </div>
        </div>

        {/* Publications Signalées */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span>Publications Signalées</span>
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Examiner et prendre des décisions sur les contenus signalés par la communauté
          </p>

          <div className="space-y-4">
            {reportedPosts.map((post) => (
              <div key={post.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium border border-red-500/30">
                      🔥 Post
                    </span>
                    <span className="text-white/60 text-sm">{post.author}</span>
                    <span className="text-white/40 text-xs">{post.timestamp}</span>
                  </div>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium border border-orange-500/30">
                    {post.reports} signalements
                  </span>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-white text-sm leading-relaxed mb-2">{post.content}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-white/40 text-xs">Motif :</span>
                    <span className="text-white/60 text-xs">{post.reason}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleApprove(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approuver</span>
                  </button>
                  <button
                    onClick={() => handleWarn(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 transition text-sm font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Avertir l'utilisateur</span>
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                  <button
                    onClick={() => handleBan(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition text-sm font-medium"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Bannir l'utilisateur</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {reportedPosts.length === 0 && (
            <div className="text-center py-12">
              <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-white/50 text-lg">Aucune publication signalée</p>
              <p className="text-white/30 mt-2">Tout est sous contrôle !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
