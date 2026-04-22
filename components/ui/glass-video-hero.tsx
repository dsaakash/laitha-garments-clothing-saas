import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, Play, Pause, Lock } from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const HeroSection = ({ setPage, showLalitaModal }: any) => {
  const [fullBleed, setFullBleed] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  // Replace this with your actual YouTube Video ID
  const VIDEO_ID = "f6bniH24RXU"; 

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current) return;
      
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          controls: 0,
          iv_load_policy: 3,
          disablekb: 1,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING is 1
            setIsPlaying(event.data === 1);
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              setVideoWatched(true);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      // Clean up if needed
    };
  }, []);

  // Using a relevant unsplash image for a garment store/boutique
  const IMAGE_URL =
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3";

  return (
    <section
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out ${
        fullBleed ? "min-h-screen" : "py-32 lg:py-40"
      }`}
    >
      {/* Height Toggle */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-[10px] backdrop-blur-xl border border-[rgba(186,117,23,0.5)] bg-[rgba(13,27,46,0.6)] text-white hover:bg-[rgba(13,27,46,0.8)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA7517]"
      >
        {fullBleed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* Image Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src={IMAGE_URL}
          alt="Lalitha Garments Store"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2E]/80 via-transparent to-[#0D1B2E]/90" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-20 px-6">
        {/* Tagline Pill */}
        <div className="inline-flex items-center gap-2.5 h-[38px] px-3.5 rounded-[10px] backdrop-blur-xl border border-[rgba(186,117,23,0.5)] bg-[rgba(13,27,46,0.6)] shadow-[0_0_20px_rgba(186,117,23,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="bg-[#BA7517] text-[#0D1B2E] font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] shadow-[0_0_8px_rgba(186,117,23,0.4)]">
            Retail Control Architect
          </span>
          <span className="font-sans font-medium text-sm text-[#FDF8EF] tracking-wide">
            India&apos;s #1 Stock System for Garment Stores
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-[#FDF8EF] text-4xl lg:text-[64px] leading-[1.1] font-black tracking-[-0.02em] mt-6 max-w-4xl drop-shadow-lg">
          Tumhari Dukaan Mein{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4921E] to-[#BA7517]">Kitna Stock</span>{' '}
          Hai — Sach Mein?
        </h1>

        {/* Video Embed Section */}
        <div className="mt-10 w-full max-w-3xl aspect-video rounded-2xl overflow-hidden border-2 border-[rgba(186,117,23,0.3)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black relative group">
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0D1B2E]/50 backdrop-blur-sm z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BA7517]"></div>
            </div>
          )}
          
          {/* 
            Distraction-Free Wrapper:
            We crop the top (title bar) and bottom (controls) by scaling and translating.
            We also disable pointer events on the iframe to prevent clicking through to YouTube.
          */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div 
              style={{ 
                position: 'absolute',
                top: '-10%', // Crop top title bar
                left: '-1%',
                width: '102%',
                height: '120%', // Make it taller to crop top/bottom
              }}
            >
              <div id="youtube-player" className="w-full h-full" />
            </div>
          </div>

          {/* Custom Controls Overlay */}
          <div 
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/0 transition-colors"
            onClick={() => {
              if (!playerRef.current) return;
              if (isPlaying) {
                playerRef.current.pauseVideo();
              } else {
                playerRef.current.playVideo();
              }
            }}
          >
            {playerReady && (
              <div className={`p-5 rounded-full bg-[rgba(186,117,23,0.8)] text-[#0D1B2E] transition-all transform shadow-[0_0_30px_rgba(186,117,23,0.5)] ${isPlaying ? 'opacity-0 scale-90 group-hover:opacity-40 group-hover:scale-100' : 'opacity-100 scale-110'}`}>
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center">
          {!videoWatched ? (
            <div className="flex items-center gap-2 text-[rgba(253,248,239,0.6)] font-sans text-sm animate-pulse">
              <Lock size={14} />
              <span>Watch until the end to unlock trial & case study</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#4A8A16] font-sans text-sm font-bold animate-bounce">
              <Play size={14} />
              <span>Unlocked! Click below to proceed</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row items-center gap-4 mt-6 transition-all duration-500 ${!videoWatched ? 'opacity-50 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
          <button
            onClick={() => videoWatched && setPage('trial')}
            disabled={!videoWatched}
            className={`group relative px-8 py-3.5 rounded-[10px] bg-gradient-to-br from-[#D4921E] to-[#BA7517] text-[#0D1B2E] font-serif font-bold text-lg transition-all shadow-[0_12px_32px_rgba(186,117,23,0.45)] ${videoWatched ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-not-allowed'}`}
          >
            {videoWatched ? '🚀 7 Din Free Try Karo' : '🔒 Locked'}
            {!videoWatched && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-[10px]">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[#0D1B2E]">Watch Video</span>
              </div>
            )}
          </button>
          <button
            onClick={() => videoWatched && showLalitaModal()}
            disabled={!videoWatched}
            className={`px-8 py-3.5 rounded-[10px] bg-[rgba(253,248,239,0.05)] border-[1.5px] border-[rgba(253,248,239,0.15)] text-[#FDF8EF] font-sans font-medium text-base transition-all backdrop-blur-md ${videoWatched ? 'hover:bg-[rgba(186,117,23,0.1)] hover:border-[#BA7517] hover:text-[#BA7517] cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
          >
            {videoWatched ? '📖 Lalita Garments Case Study' : '🔒 Case Study Locked'}
          </button>
        </div>
      </div>
    </section>
  );
};
