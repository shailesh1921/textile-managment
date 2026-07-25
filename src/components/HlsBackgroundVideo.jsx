import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export function HlsBackgroundVideo({ src, poster, overlayColor = 'bg-black/40' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setIsLoading(true);

    const handlePlaySuccess = () => {
      setIsLoading(false);
    };

    const handlePlayError = (e) => {
      console.warn("Autoplay block or playback issue:", e);
      // Muted video should auto-play, but we still handle it
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(handlePlaySuccess).catch(handlePlayError);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("HLS Network error, trying to recover...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("HLS Media error, trying to recover...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal HLS error, falling back to poster/background.", data);
              setHasError(true);
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for Safari / iOS native HLS
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(handlePlaySuccess).catch(handlePlayError);
      });
      video.addEventListener('error', (e) => {
        console.error("Native HLS playback error:", e);
        setHasError(true);
        setIsLoading(false);
      });
    } else {
      console.error("HLS not supported by this browser.");
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0 bg-[#09060f]">
      {/* Fallback poster or loading state placeholder */}
      {(hasError || isLoading) && poster && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url('${poster}')` }}
        />
      )}

      {/* Actual Video Element */}
      {!hasError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          muted
          autoPlay
          loop
          playsInline
          poster={poster}
        />
      )}

      {/* Dark tint overlay for readability */}
      {overlayColor && (
        <div className={`absolute inset-0 z-10 ${overlayColor} mix-blend-multiply`} />
      )}
    </div>
  );
}
