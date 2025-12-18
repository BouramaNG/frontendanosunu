import { useState, useRef, useEffect } from 'react';
import { Play, Zap } from '@/lib/icons';
import { detectVideoCapture } from '../utils/contentProtection';

interface BlackRoomVideoPlayerProps {
  videoPath: string;
  isEphemeral?: boolean;
  isAudio?: boolean;
}

export default function BlackRoomVideoPlayer({ 
  videoPath, 
  isEphemeral = false,
  isAudio = false 
}: BlackRoomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setShowPlayButton(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="relative mb-4 rounded-xl overflow-hidden group/video bg-black/20">
      <video
        ref={(el) => {
          if (el) {
            detectVideoCapture(el);
            videoRef.current = el;
          }
        }}
        src={videoPath}
        controls={isPlaying}
        controlsList="nodownload noremoteplayback"
        className="w-full rounded-xl select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        preload="metadata"
        onClick={handlePlayClick}
      />
      
      {/* Bouton Play stylé au centre */}
      {showPlayButton && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm cursor-pointer group/play z-20"
          onClick={handlePlayClick}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse"></div>
            {/* Cercle principal */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
          </div>
        </div>
      )}
      
      {/* Badge Audio converti */}
      {isAudio && (
        <div className="absolute top-4 left-4 bg-purple-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 z-10">
          <Zap className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold">Audio</span>
        </div>
      )}
      {isEphemeral && (
        <div className="absolute top-4 right-4 bg-yellow-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1 z-10">
          <Zap className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold">Éphémère</span>
        </div>
      )}
    </div>
  );
}

