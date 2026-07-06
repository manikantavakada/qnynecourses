'use client';

import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({ videoId, userLabel }: { videoId: string; userLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstance = useRef<Hls | null>(null);

  const [watermark, setWatermark] = useState({ top: 20, left: 20 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quality Selection State
  const [hlsLevels, setHlsLevels] = useState<Array<{ index: number; name: string }>>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

  useEffect(() => {
    let hls: Hls | undefined;
    let token = '';
    let timer: number | undefined;

    async function refreshPlayback() {
      const playback = await api<{ url: string; token: string; expiresAt: string }>(`/videos/${videoId}/play`, { method: 'POST' });
      token = playback.token;
      return playback;
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const playback = await refreshPlayback();
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported() && playback.url.includes('.m3u8')) {
          hls = new Hls({
            xhrSetup: (xhr, url) => {
              const nextUrl = url.includes('token=') ? url : `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
              xhr.open('GET', nextUrl, true);
            },
          });
          hlsInstance.current = hls;

          hls.loadSource(playback.url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const levels = hls!.levels.map((level, index) => ({
              index,
              name: level.name || (level.height ? `${level.height}p` : `Stream ${index + 1}`),
            }));
            setHlsLevels(levels);
            setLoading(false);
          });
        } else {
          video.src = playback.url;
          setHlsLevels([]);
          setLoading(false);
        }

        timer = window.setInterval(
          () => void refreshPlayback().catch(() => {}),
          Math.max(new Date(playback.expiresAt).getTime() - Date.now() - 60_000, 60_000)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unauthorized or failed playback request.');
        setLoading(false);
      }
    }

    void load();

    return () => {
      if (timer) window.clearInterval(timer);
      hls?.destroy();
      hlsInstance.current = null;
    };
  }, [videoId]);

  // Watermark random placement interval
  useEffect(() => {
    const interval = window.setInterval(() => {
      setWatermark({ top: 10 + Math.random() * 70, left: 8 + Math.random() * 64 });
    }, 8_000);
    return () => window.clearInterval(interval);
  }, []);

  // Pause playback while the tab is hidden/backgrounded to discourage unattended capture
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) videoRef.current?.pause();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Update Fullscreen State Listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Custom Controls Actions
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.currentTime = value;
    setCurrentTime(value);
  }

  function skip(amount: number) {
    const video = videoRef.current;
    if (!video) return;
    const target = video.currentTime + amount;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, target));
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const val = Number(e.target.value);
    setVolume(val);
    video.volume = val;
    setIsMuted(val === 0);
    video.muted = val === 0;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    video.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      video.volume = 0.5;
    }
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      void container.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  function handleQualityChange(levelIndex: number) {
    if (hlsInstance.current) {
      hlsInstance.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
    setQualityMenuOpen(false);
  }

  if (error) {
    return (
      <div className="relative flex flex-col items-center justify-center aspect-video w-full rounded border border-line bg-neutral-900 text-white p-6 text-center">
        <p style={{ color: 'var(--rose)', fontWeight: 650, fontSize: 15, marginBottom: 8 }}>Playback Error</p>
        <p style={{ color: 'var(--text-faint)', fontSize: 13, maxWidth: 360, margin: '0 auto 16px', lineHeight: 1.5 }}>
          {error}
        </p>
        {error.toLowerCase().includes('unauthorized') && (
          <a href="/login" className="btn btn-primary btn-sm" style={{ display: 'inline-block', fontSize: 12 }}>
            Log In Again
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded border border-line bg-black group w-full aspect-video"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white z-20">
          <Loader2 className="animate-spin" size={40} />
        </div>
      )}

      {/* Watermark - two offset copies so cropping one out still leaves the other visible */}
      {!loading && (
        <>
          <div
            className="pointer-events-none absolute rounded bg-black/30 px-2 py-1 text-xs text-white z-10 select-none transition-all duration-300"
            style={{ top: `${watermark.top}%`, left: `${watermark.left}%` }}
          >
            {userLabel} {new Date().toLocaleString()}
          </div>
          <div
            className="pointer-events-none absolute rounded bg-black/30 px-2 py-1 text-xs text-white z-10 select-none transition-all duration-300"
            style={{ top: `${(watermark.top + 45) % 90}%`, left: `${(watermark.left + 40) % 84}%` }}
          >
            {userLabel} {new Date().toLocaleString()}
          </div>
        </>
      )}

      {/* Custom Control Overlay (visible on hover) */}
      {!loading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 p-3">
          {/* Progress Timeline bar */}
          <div className="flex items-center gap-2 mb-2 w-full">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 accent-indigo-500 rounded cursor-pointer transition-all hover:h-2"
              aria-label="Video Seek Timeline"
            />
          </div>

          {/* Lower Control Bar */}
          <div className="flex items-center justify-between text-white w-full">
            {/* Left controls */}
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-indigo-400 transition-colors" type="button" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>

              <button onClick={() => skip(-10)} className="hover:text-indigo-400 transition-colors" type="button" aria-label="Rewind 10 seconds">
                <RotateCcw size={18} />
              </button>

              <button onClick={() => skip(10)} className="hover:text-indigo-400 transition-colors" type="button" aria-label="Forward 10 seconds">
                <RotateCw size={18} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/volume">
                <button onClick={toggleMute} className="hover:text-indigo-400 transition-colors" type="button" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-16 h-1 bg-white/20 accent-indigo-500 rounded cursor-pointer transition-all"
                  aria-label="Volume Slider"
                />
              </div>

              {/* Time displays */}
              <span className="text-xs font-mono select-none">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-4 relative">
              {/* Quality Settings trigger */}
              {hlsLevels.length > 0 && (
                <div>
                  <button
                    onClick={() => setQualityMenuOpen(!qualityMenuOpen)}
                    className="hover:text-indigo-400 transition-colors flex items-center gap-1"
                    type="button"
                    aria-label="Quality settings"
                  >
                    <Settings size={18} />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {currentLevel === -1 ? 'Auto' : hlsLevels[currentLevel]?.name}
                    </span>
                  </button>

                  {/* Quality popover list */}
                  {qualityMenuOpen && (
                    <div className="absolute bottom-8 right-8 bg-neutral-950/95 border border-white/10 rounded-md p-1.5 flex flex-col gap-1 w-24 z-30 shadow-lg text-xs font-mono">
                      <button
                        className={`text-left p-1 rounded hover:bg-white/10 ${currentLevel === -1 ? 'text-indigo-400 font-bold' : 'text-white'}`}
                        onClick={() => handleQualityChange(-1)}
                        type="button"
                      >
                        Auto
                      </button>
                      {hlsLevels.map((lvl) => (
                        <button
                          key={lvl.index}
                          className={`text-left p-1 rounded hover:bg-white/10 ${currentLevel === lvl.index ? 'text-indigo-400 font-bold' : 'text-white'}`}
                          onClick={() => handleQualityChange(lvl.index)}
                          type="button"
                        >
                          {lvl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen toggle */}
              <button onClick={toggleFullscreen} className="hover:text-indigo-400 transition-colors" type="button" aria-label="Toggle fullscreen">
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
