import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    // handle standalone checks for various browsers/OS
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
      
    setIsStandalone(!!isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Show prompt if we have not dismissed it
      if (!localStorage.getItem('pwa-prompt-dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not standalone, we might want to manually show a generic "how to install" guide
    // iOS doesn't support beforeinstallprompt event yet natively in WebKit in the same way
    if (isIOSDevice && !isStandaloneMode && !localStorage.getItem('pwa-prompt-dismissed')) {
       // delay before showing to not be too aggressive
       const timer = setTimeout(() => setShowPrompt(true), 3000);
       return () => clearTimeout(timer);
    }

    // For other devices, if we don't get the event but we want to show a prompt anyway
    // (Testing environments usually). We will rely mainly on beforeinstallprompt though.
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
       // Inform iOS user how to install since programmatic install is not supported
       alert('To install the app on iOS:\n1. Tap the Share button at the bottom of the screen.\n2. Scroll down and select "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-8 md:w-96 z-50 bg-[#1A0B2E] border border-royal-purple/50 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-royal-purple/20 border border-royal-purple/30 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-lilac" />
            </div>
            <div className="flex-1 pr-4">
              <h3 className="text-white font-medium text-sm mb-1">Install Pistis Hub</h3>
              <p className="text-white/60 text-xs mb-3 leading-relaxed">
                Add to your home screen for a faster, app-like experience with offline capabilities.
              </p>
              <button
                onClick={handleInstallClick}
                className="bg-royal-purple hover:bg-royal-purple/80 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors w-full"
              >
                {isIOS ? 'How to install' : 'Add to Home Screen'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
