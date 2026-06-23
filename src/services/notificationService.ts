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

  /**
   * Handle real-time DB unit report events and dispatch role-based push notifications.
   */
  static handleRealtimeUnitReportEvent(payload: any, currentUser: any) {
    if (!currentUser) return;
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    if (!record) return;

    const { id, unit_name, unit_type, branch_name, submitter_name, submitted_by, status } = record;

    if (eventType === 'INSERT') {
      // Rule 1: When a new unit report is submitted, notify BRANCH_ADMIN of that branch
      if (currentUser.role === 'BRANCH_ADMIN' && currentUser.branchName === branch_name) {
        if (currentUser.id !== submitted_by) {
          this.sendLocalNotification("New Unit Report Submitted", {
            body: `${submitter_name || "A leader"} submitted a weekly report for "${unit_name}" (${unit_type || "Unit"}) in your branch.`,
            tag: `unit-report-${id}`
          });
        }
      }
    } else if (eventType === 'UPDATE') {
      // Rule 2: When a unit report status changes (approved, action/revision required), notify the unit's leaders
      const isMyReport = currentUser.id === submitted_by || 
                          (currentUser.branchName === branch_name && 
                           (currentUser.deptName === unit_name || currentUser.groupName === unit_name));
      
      if (isMyReport) {
        if (status === 'APPROVED_BY_BRANCH' || status === 'APPROVED') {
          this.sendLocalNotification("Unit Report Approved 🎉", {
            body: `Your report for "${unit_name}" has been approved by branch administration.`,
            tag: `unit-report-${id}`
          });
        } else if (status === 'NEEDS_REVISION' || status === 'REJECTED' || status === 'REVISION_REQUESTED') {
          this.sendLocalNotification("Revision Required ⚠️", {
            body: `Your report for "${unit_name}" has been marked for revision. Please review feedback.`,
            tag: `unit-report-${id}`
          });
        }
      }
    }
  }

  /**
   * Handle real-time DB branch report events and dispatch role-based push notifications.
   */
  static handleRealtimeBranchReportEvent(payload: any, currentUser: any) {
    if (!currentUser) return;
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    if (!record) return;

    const { id, branch_name, submitter_name, submitted_by, status } = record;

    if (eventType === 'INSERT') {
      // Rule 3: When a new branch report is submitted, notify GLOBAL_ADMINs (HQ)
      if (currentUser.role === 'GLOBAL_ADMIN') {
        if (currentUser.id !== submitted_by) {
          this.sendLocalNotification("New Branch Report Consolidated", {
            body: `Branch Admin ${submitter_name || "Admin"} completed consolidation and submitted the report for "${branch_name}".`,
            tag: `branch-report-${id}`
          });
        }
      }
    } else if (eventType === 'UPDATE') {
      // Rule 4: When a branch report status changes, notify the branch admin for that branch
      if (currentUser.role === 'BRANCH_ADMIN' && currentUser.branchName === branch_name) {
        if (status === 'APPROVED' || status === 'APPROVED_BY_HQ') {
          this.sendLocalNotification("Branch Report Approved HQ 🌟", {
            body: `Your consolidated report for "${branch_name}" was approved by Global HQ.`,
            tag: `branch-report-${id}`
          });
        } else if (status === 'REVISION_REQUESTED' || status === 'REJECTED' || status === 'NEEDS_REVISION') {
          this.sendLocalNotification("Branch Revision Required ⚠️", {
            body: `Your consolidated report for "${branch_name}" requires attention or revision.`,
            tag: `branch-report-${id}`
          });
        }
      }
    }
  }

  static handleRealtimeProfileEvent(payload: any, currentUser: any) {
    if (!currentUser) return;
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    if (!record) return;

    const { id, full_name, role, branch_name, status } = record;

    if (eventType === 'INSERT' && status === 'PENDING') {
      const getRoutingKey = (roleStr: string) => {
        return (roleStr.includes("GLOBAL_ADMIN") || roleStr.includes("BRANCH_ADMIN")) ? "GLOBAL" : "BRANCH";
      };
      
      const routingKey = getRoutingKey(role || "");
      const userRoles = currentUser.roles || [currentUser.role];
      
      if (routingKey === "GLOBAL" && userRoles.includes("GLOBAL_ADMIN")) {
        this.sendLocalNotification("New Leader Registration", {
          body: `${full_name} has registered for ${role.replace(/_/g, ' ')} and is awaiting approval.`,
          tag: `profile-registration-${id}`
        });
      } else if (routingKey === "BRANCH" && userRoles.includes("BRANCH_ADMIN") && currentUser.branchName === branch_name) {
        this.sendLocalNotification("New Unit Leader Registration", {
          body: `${full_name} has registered for ${role.replace(/_/g, ' ')} in ${branch_name} and is awaiting your approval.`,
          tag: `profile-registration-${id}`
        });
      }
    } else if (eventType === 'UPDATE' && currentUser.id === id) {
      if (status === 'APPROVED') {
        this.sendLocalNotification("Account Approved 🌟", {
          body: `Your account has been officially approved! You can now log in securely.`,
          tag: `profile-approved-${id}`
        });
      }
    }
  }
}
