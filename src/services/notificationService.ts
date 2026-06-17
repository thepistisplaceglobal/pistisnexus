// Offline-first PWA Notification & Sound Coordination Service
export type NotificationType = "broadcast" | "event" | "report" | "nudge";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string; // ISO date string or relative display
  type: NotificationType;
  read: boolean;
}

const defaultNotifications: NotificationItem[] = [
  { id: "init-1", type: "broadcast", title: "New Global Broadcast", message: "Global leaders retreat dates announced.", time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), read: false },
  { id: "init-2", type: "event", title: "Upcoming Birthday", message: "Ekemini Iyanam's birthday is today.", time: new Date(Date.now() - 1000 * 60 * 60).toISOString(), read: false },
  { id: "init-3", type: "event", title: "Upcoming Birthday", message: "Tessy Peter's birthday is tomorrow.", time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), read: true },
  { id: "init-4", type: "report", title: "Pending Report", message: "Calabar monthly growth metrics are ready for review.", time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true },
];

export const NotificationService = {
  /**
   * Fetch all notifications from persistent client storage (localStorage)
   */
  getNotifications(): NotificationItem[] {
    const data = localStorage.getItem("app_pwa_notifications");
    if (!data) {
      localStorage.setItem("app_pwa_notifications", JSON.stringify(defaultNotifications));
      return defaultNotifications;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultNotifications;
    }
  },

  /**
   * Save notifications and update PWA badging/events
   */
  saveNotifications(list: NotificationItem[]) {
    localStorage.setItem("app_pwa_notifications", JSON.stringify(list));
    this.updateAppBadge();
    
    // Broadcast a custom event to notify components like NotificationBell instantly
    window.dispatchEvent(new CustomEvent("app-notifications-updated", { detail: list }));
  },

  /**
   * Calculate unread notifications (or alerts combined)
   */
  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  },

  /**
   * Request native OS permission to display push notification overlays
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      return "denied";
    }
    if (Notification.permission === "granted") {
      return "granted";
    }
    return await Notification.requestPermission();
  },

  /**
   * Update PWA Icon Badge count dynamically utilizing Web Badging API 
   * This displays a numeric badge overlay on the installed phone app / laptop shortcut!
   */
  async updateAppBadge() {
    const unreadCount = this.getUnreadCount();
    if ("setAppBadge" in navigator) {
      try {
        if (unreadCount > 0) {
          await (navigator as any).setAppBadge(unreadCount);
        } else {
          await (navigator as any).clearAppBadge();
        }
      } catch (err) {
        console.warn("PWA Badging API failed or not supported on this platform:", err);
      }
    }
  },

  /**
   * Synthesize high-fidelity sound notifications using the Web Audio API without relying on external mp3 assets.
   * This guarantees 100% offline, latency-free operation on both laptops & mobile processors.
   */
  playNotificationSound(type: "chime" | "success" | "alert" | "nudge" = "chime") {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Auto-resume if context is suspended due to autoplay restrictions
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;

      switch (type) {
        case "success":
          // Elegant double ascending chime
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.52);
          break;

        case "alert":
          // Attention-grabbing dual-harmonic tone
          osc.type = "triangle";
          osc.frequency.setValueAtTime(880, now); // A5
          osc.frequency.linearRampToValueAtTime(440, now + 0.16); // Fall to A4
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.38);
          break;

        case "nudge":
          // Distinct alertive digital ping double pulse
          osc.type = "sine";
          osc.frequency.setValueAtTime(987.77, now); // B5 High sound
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 Higher sound
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
          gain.gain.linearRampToValueAtTime(0.05, now + 0.08);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.10);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.4);
          break;

        case "chime":
        default:
          // Premium classic ambient Notification Chime (Harmonized Sine)
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now); // A5
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.10); // A6
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.28);
          break;
      }
    } catch (err) {
      console.warn("Offline synthesized audio playback failed or was blocked by autoplay security:", err);
    }
  },

  /**
   * Dispatch a notification offline or online. This will write to local state logs,
   * invoke AppIconBadge counts, play sound triggers, and emit standalone OS/banner alert alerts.
   */
  async triggerNotification(title: string, message: string, type: NotificationType = "broadcast") {
    // 1. Add notification node to localStorage checklist
    const list = this.getNotifications();
    const newNotif: NotificationItem = {
      id: "nt-" + Math.random().toString(36).substring(2, 11),
      title,
      message,
      time: new Date().toISOString(),
      type,
      read: false
    };

    list.unshift(newNotif);
    this.saveNotifications(list);

    // 2. Play acoustic synthesizer chime
    let soundType: "nudge" | "alert" | "chime" = "chime";
    if (type === "nudge") {
      soundType = "nudge";
    } else if (type === "report") {
      soundType = "alert";
    }
    this.playNotificationSound(soundType);

    // 3. Dispatch Native PWA Notification if permission granted & app in background or standalone
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          tag: type,
          icon: "/favicon.png",
          badge: "/favicon.png",
        });
      } catch (err) {
        console.warn("Direct Notification creation rejected by system configuration:", err);
      }
    }
  },

  /**
   * Mark a single notification id as read
   */
  markAsRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map(item => item.id === id ? { ...item, read: true } : item);
    this.saveNotifications(updated);
  },

  /**
   * Clear or read-all notifications
   */
  markAllAsRead() {
    const list = this.getNotifications();
    const updated = list.map(item => ({ ...item, read: true }));
    this.saveNotifications(updated);
  },

  /**
   * Clear all notification history
   */
  clearAll() {
    this.saveNotifications([]);
  }
};
