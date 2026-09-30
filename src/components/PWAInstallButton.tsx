import React, { useState } from 'react';
import { Download, Share, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);

  if (isInstalled || hasInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setHasInstalled(true);
    }
  };

  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={handleInstallClick}
          title="Install App"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium hover:bg-cyan-500/25 transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-indigo-950/40 hover:opacity-95 transition active:scale-[0.98]"
      >
        <Download className="w-4 h-4" />
        <span>Install Aetheria PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {compact ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700/80 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-700/90 transition active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Install on iOS Device</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#11141c] border border-slate-800 p-6 text-slate-200 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Share className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Install on iPhone / iPad</h3>
                  <p className="text-xs text-slate-400">Add to your home screen</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-mono shrink-0">1</span>
                  <span>Tap the <strong className="text-white">Share</strong> button in the bottom Safari bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-mono shrink-0">2</span>
                  <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-mono shrink-0">3</span>
                  <span>Tap <strong className="text-white">Add</strong> in the top right corner.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-medium text-xs hover:bg-cyan-400 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
