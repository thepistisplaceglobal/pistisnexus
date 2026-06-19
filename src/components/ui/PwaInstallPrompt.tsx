import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a few seconds before showing the prompt so it's not too intrusive
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[150] p-4 rounded-2xl shadow-2xl border max-w-sm w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-8 duration-500 ${
      theme === "light" 
        ? "bg-white border-slate-200 text-slate-800" 
        : "bg-[#110524]/95 backdrop-blur-xl border-royal-purple/30 text-white"
    }`}>
      <button 
        onClick={handleDismiss}
        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
          theme === "light" ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-white/40"
        }`}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className={`p-3 rounded-xl shrink-0 ${
          theme === "light" ? "bg-royal-purple/10 text-royal-purple" : "bg-royal-purple/20 text-[#B193FB]"
        }`}>
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm mb-1">Install App</h3>
          <p className={`text-xs mb-3 leading-relaxed ${
            theme === "light" ? "text-slate-500" : "text-white/60"
          }`}>
            Add Pistis Nexus to your home screen for quick access, offline mode, and a better experience.
          </p>
          <button
            onClick={handleInstall}
            className="text-xs font-bold bg-royal-purple hover:bg-royal-purple/90 active:scale-95 text-white px-4 py-2 rounded-lg transition-all"
          >
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
}
