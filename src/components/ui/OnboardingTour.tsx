import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/store/useAppStore";
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react";

interface Step {
  targetId: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: Step[] = [
  {
    targetId: "tour-dashboard-metrics",
    title: "Intelligence Hub",
    content: "This is your main dashboard. View real-time metrics, system health, and high-level operations data.",
    position: "bottom",
  },
  {
    targetId: "tour-sidebar-nav",
    title: "Global Navigation",
    content: "Jump between different branches, departments, and cells. The sidebar adjusts to your administrative role.",
    position: "right",
  },
  {
    targetId: "tour-global-messaging",
    title: "Nexus Comms",
    content: "Send and receive real-time messages across your entire organizational structure.",
    position: "left",
  },
  {
    targetId: "tour-directory",
    title: "Leaders Directory",
    content: "Quickly access and manage contacts for all organizational leaders globally.",
    position: "right",
  }
];

export function OnboardingTour() {
  const { user, updateUser } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const lastScrolledStepRef = React.useRef<number | null>(null);
  
  // Start tour only if user hasn't completed it and we are on the dashboard
  const isActive = user && !user.hasCompletedTour && window.location.pathname === "/";
  
  useEffect(() => {
    if (!isActive) return;
    
    let observer: ResizeObserver | null = null;
    let timerId: any = null;

    const updateRect = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;
      
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect((prev) => {
          if (
            prev &&
            prev.left === rect.left &&
            prev.top === rect.top &&
            prev.width === rect.width &&
            prev.height === rect.height
          ) {
            return prev;
          }
          return rect;
        });
        
        if (lastScrolledStepRef.current !== currentStep) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastScrolledStepRef.current = currentStep;
        }

        if (!observer) {
          observer = new ResizeObserver(() => {
            const r = el.getBoundingClientRect();
            setTargetRect(r);
          });
          observer.observe(el);
        }
      } else {
        setTargetRect(null);
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    };

    // Run immediately
    updateRect();
    
    // Polling fallback to wait for async loading elements in views
    timerId = setInterval(() => {
      updateRect();
    }, 200);

    const handleScrollOrResize = () => {
      updateRect();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, { capture: true });
    
    return () => {
      if (timerId) clearInterval(timerId);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true });
    };
  }, [isActive, currentStep]);

  // Reset the scroll trigger when active step changes
  useEffect(() => {
    lastScrolledStepRef.current = null;
  }, [currentStep]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  
  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };
  
  const handleComplete = () => {
    updateUser({ hasCompletedTour: true });
  };
  
  const handleSkip = () => {
    updateUser({ hasCompletedTour: true });
  };

  // Determine popover position based on targetRect
  let popoverStyle: React.CSSProperties = {};
  if (targetRect) {
    const spacing = 16;
    switch (step.position) {
      case "bottom":
        popoverStyle = { top: targetRect.bottom + spacing, left: Math.max(20, targetRect.left) };
        break;
      case "right":
        popoverStyle = { top: targetRect.top, left: targetRect.right + spacing };
        break;
      case "left":
        popoverStyle = { top: targetRect.top, right: window.innerWidth - targetRect.left + spacing };
        break;
      case "top":
      default:
        popoverStyle = { bottom: window.innerHeight - targetRect.top + spacing, left: Math.max(20, targetRect.left) };
        break;
    }
    
    // Prevent overflow in basic way
    if (popoverStyle.left && (popoverStyle.left as number) + 320 > window.innerWidth) {
       popoverStyle.left = window.innerWidth - 340;
    }
  } else {
    // Elegant centered fallback position while element of interest is locating
    popoverStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay with cutout - Only interactive and darkened when target area is cleanly mapped */}
        {targetRect && (
          <div 
            className="absolute inset-0 bg-black/60 transition-all duration-300 pointer-events-auto"
            style={{
              clipPath: `polygon(
                0% 0%, 0% 100%, ${targetRect.left - 10}px 100%, ${targetRect.left - 10}px ${targetRect.top - 10}px,
                ${targetRect.right + 10}px ${targetRect.top - 10}px, ${targetRect.right + 10}px ${targetRect.bottom + 10}px,
                ${targetRect.left - 10}px ${targetRect.bottom + 10}px, ${targetRect.left - 10}px 100%, 100% 100%, 100% 0%
              )`
            }}
          />
        )}

        {/* Popover */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="absolute bg-[#120524] border border-royal-purple/40 shadow-2xl shadow-royal-purple/20 rounded-xl p-5 w-[320px] pointer-events-auto"
          style={popoverStyle}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-white font-bold tracking-wide">{step.title}</h3>
            <button onClick={handleSkip} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-lilac text-sm mb-6 leading-relaxed">
            {step.content}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? "bg-royal-purple" : "bg-white/20"}`} />
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/5 text-white/70 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              
              <button 
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-royal-purple hover:bg-royal-purple/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>Finish <Check className="w-3.5 h-3.5" /></>
                ) : (
                  <>Next <ChevronRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
