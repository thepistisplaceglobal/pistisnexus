import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Bell } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function ReportDeadlineAlert() {
  const user = useAppStore(state => state.user);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const notifiedThisWeek = useRef(false);

  useEffect(() => {
    if (!user) return;
    const isBranchAdmin = user.role === 'BRANCH_ADMIN';
    const isSubLeader = ['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER', 'FOUNDATION_LEADER', 'CELL_COORDINATOR'].includes(user.role);

    if (!isSubLeader && !isBranchAdmin) return;

    const checkDeadline = () => {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const isMonday = now.getDay() === 1;
      
      if (isSubLeader && isSunday && !notifiedThisWeek.current) {
        const msg = user.role === 'CELL_LEADER'
          ? "Don't forget! Your weekly cell report is due by 6:00 PM tonight."
          : "Don't forget! Your weekly report is due by 11:59 PM tonight.";
        triggerAlert(msg);
        notifiedThisWeek.current = true;
      }
      
      if (isBranchAdmin && isMonday && !notifiedThisWeek.current && now.getHours() <= 9) {
        triggerAlert("Don't forget! Your branch report is due by 9:00 AM today.");
        notifiedThisWeek.current = true;
      }
    };

    checkDeadline(); // Check on mount
    const interval = setInterval(checkDeadline, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        triggerAlert("Notifications enabled! You will be reminded on Sundays.");
      }
    }
  };

  const triggerAlert = (message: string) => {
    // 1. Browser Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 Report Deadline Reminder", {
        body: message,
      });
    }

    // 2. Play a "Ring out" sound (using Web Audio API for a bell like sound)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playChime = (delay: number, freq: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + delay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 1.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 1.5);
      };

      // Ringing chord pattern to act as a proper push alert sound
      playChime(0, 523.25); // C5
      playChime(0.1, 659.25); // E5
      playChime(0.2, 783.99); // G5
      playChime(0.4, 1046.50); // C6
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  if (!user) return null;
  const isBranchAdmin = user.role === 'BRANCH_ADMIN';
  const isSubLeader = ['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER', 'FOUNDATION_LEADER', 'CELL_COORDINATOR'].includes(user.role);

  if (!isSubLeader && !isBranchAdmin) return null;

  const deadlineMessage = isBranchAdmin 
    ? "Due every Monday at 9:00 AM" 
    : user.role === 'CELL_LEADER'
    ? "Due every Sunday at 6:00 PM"
    : "Due every Sunday at 11:59 PM";

  const getAlertMessage = () => {
    if (isBranchAdmin) {
      return "Don't forget! Your branch report is due by 9:00 AM today.";
    }
    if (user.role === 'CELL_LEADER') {
      return "Don't forget! Your weekly cell report is due by 6:00 PM tonight.";
    }
    return "Don't forget! Your weekly report is due by 11:59 PM tonight.";
  };

  const getTestMessage = () => {
    if (isBranchAdmin) {
      return "This is a test reminder. Live reminders ring out on Mondays.";
    }
    if (user.role === 'CELL_LEADER') {
      return "This is a test reminder. Live cell reminders ring out on Sundays at 6:00 PM.";
    }
    return "This is a test reminder. Live reminders ring out on Sundays.";
  };

  return (
    <div className="flex flex-col gap-2">
       <GlassCard className="p-4 border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div className="flex items-center gap-3">
           <div className="p-2 bg-amber-500/20 rounded-lg">
             <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
           </div>
           <div>
             <h4 className="text-amber-400 font-medium text-sm">Report Deadline</h4>
             <p className="text-amber-200/70 text-xs mt-0.5">
               {deadlineMessage} ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
             </p>
           </div>
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
            {permission !== "granted" && (
                <button 
                  onClick={requestPermission}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                Enable Push Alerts
                </button>
            )}
            <button 
              onClick={() => triggerAlert(getTestMessage())}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Test Alert
            </button>
         </div>
       </GlassCard>
    </div>
  );
}
