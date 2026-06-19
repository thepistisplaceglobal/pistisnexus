export class NotificationService {
  static requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  static async sendLocalNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(title, {
            icon: '/favicon.png',
            badge: '/favicon.png',
            ...options,
          });
        } else {
          new Notification(title, {
            icon: '/favicon.png',
            ...options
          });
        }
      } catch (err) {
        new Notification(title, {
          icon: '/favicon.png',
          ...options
        });
      }
    }
  }

  static scheduleDeadlineAlerts(userRole: string | undefined) {
    if (!userRole || userRole === 'GLOBAL_ADMIN') return;
    
    // Check every minute for deadline thresholds
    // Assuming Friday 6PM is a typical unit deadline, let's just make it simple
    // For demonstration, we'll notify if it's currently Friday
    // In a real app, you'd store the "lastNotified" state.
    
    const checkDeadline = () => {
      const now = new Date();
      const isFriday = now.getDay() === 5;
      const isAfterWarningTime = now.getHours() >= 14 && now.getHours() < 20; // Between 2pm and 8pm
      
      const lastNotifiedKey = `deadline_notified_${now.toDateString()}`;
      
      if (isFriday && isAfterWarningTime && !localStorage.getItem(lastNotifiedKey)) {
        this.sendLocalNotification("Report Deadline Approaching", {
          body: "Please ensure your weekly report is submitted before the deadline."
        });
        localStorage.setItem(lastNotifiedKey, "true");
      }
    };

    // Run check every 5 minutes
    setInterval(checkDeadline, 5 * 60 * 1000);
    // And run once immediately
    checkDeadline();
  }
}
