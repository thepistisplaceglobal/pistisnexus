import { supabase } from "@/lib/supabase";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  branch_name: string | null;
  action_type: string;
  details: string;
  created_at: string;
  is_fallback?: boolean;
}

export const ActivityService = {
  /**
   * Log an activity to Supabase database.
   * Fails silently/gracefully if table design is not yet applied.
   */
  async logActivity(payload: {
    user_id?: string | null;
    user_name: string;
    user_role: string;
    branch_name?: string | null;
    action_type: string;
    details: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from("activity_logs").insert([
        {
          user_id: payload.user_id || null,
          user_name: payload.user_name,
          user_role: payload.user_role,
          branch_name: payload.branch_name || null,
          action_type: payload.action_type,
          details: payload.details,
        },
      ]);

      if (error) {
        console.warn("Failed to log activity to remote DB (table may not exist yet):", error.message);
        // Save to localStorage as a fallback local activity cache to preserve interactive experience
        const localLogs = JSON.parse(localStorage.getItem("local_activity_logs") || "[]");
        localLogs.unshift({
          id: Math.random().toString(36).substr(2, 9),
          user_id: payload.user_id || null,
          user_name: payload.user_name,
          user_role: payload.user_role,
          branch_name: payload.branch_name || null,
          action_type: payload.action_type,
          details: payload.details,
          created_at: new Date().toISOString(),
          is_fallback: true
        });
        localStorage.setItem("local_activity_logs", JSON.stringify(localLogs.slice(0, 50)));
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception in logActivity:", e);
      return false;
    }
  },

  /**
   * Fetches the activity log from the DB.
   * If the table does not exist, gathers real data from other active tables
   * (reports, messages, etc.) and combines them with localStorage logs
   * to produce a high-fidelity dynamic feed.
   */
  async getActivities(currentUserBranch?: string | null): Promise<{ data: ActivityLog[]; requiresTableSetup: boolean }> {
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);

      const { data, error } = await query;

      if (error) {
        // Table doesn't exist yet on remote Supabase or has permissions issue.
        // We will activate the hybrid real-time fallback aggregator!
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          const fallbackData = await this.compileAggregatedFallbackFeed(currentUserBranch);
          return { data: fallbackData, requiresTableSetup: true };
        }
        throw error;
      }

      return { data: data || [], requiresTableSetup: false };
    } catch (err: any) {
      console.warn("Error retrieving activity logs from DB, rendering fallback stream:", err);
      const fallbackData = await this.compileAggregatedFallbackFeed(currentUserBranch);
      return { data: fallbackData, requiresTableSetup: true };
    }
  },

  /**
   * Aggregates real operational data into a unified activity feed
   */
  async compileAggregatedFallbackFeed(currentUserBranch?: string | null): Promise<ActivityLog[]> {
    const activities: ActivityLog[] = [];

    try {
      // 1. Fetch recent Unit Reports
      let unitQuery = supabase.from("unit_reports").select("*").limit(15);
      if (currentUserBranch) {
        unitQuery = unitQuery.eq("branch_name", currentUserBranch);
      }
      const { data: unitReports } = await unitQuery;

      if (unitReports) {
        unitReports.forEach((report) => {
          activities.push({
            id: `unit-${report.id}`,
            user_id: report.submitted_by,
            user_name: report.submitter_name,
            user_role: report.unit_type === "CELL" ? "CELL_LEADER" : "DEPT_LEADER",
            branch_name: report.branch_name,
            action_type: report.status === "APPROVED" ? "REPORT_APPROVED" : "REPORT_SUBMITTED",
            details: report.status === "APPROVED" 
              ? `Report for unit "${report.unit_name}" was approved by branch administration.`
              : `Submitted weekly metrics report for ${report.unit_type} "${report.unit_name}".`,
            created_at: report.created_at,
            is_fallback: true
          });
        });
      }

      // 2. Fetch recent Branch Reports
      let branchQuery = supabase.from("branch_reports").select("*").limit(10);
      if (currentUserBranch) {
        branchQuery = branchQuery.eq("branch_name", currentUserBranch);
      }
      const { data: branchReports } = await branchQuery;

      if (branchReports) {
        branchReports.forEach((report) => {
          activities.push({
            id: `branch-${report.id}`,
            user_id: report.submitted_by,
            user_name: report.submitter_name,
            user_role: "BRANCH_ADMIN",
            branch_name: report.branch_name,
            action_type: report.status === "APPROVED" ? "BRANCH_REPORT_APPROVED" : "BRANCH_REPORT_COMPILED",
            details: report.status === "APPROVED"
              ? `Compiled branch metrics for "${report.branch_name}" approved by HQ.`
              : `Compiled weekly branch consolidation report for "${report.branch_name}".`,
            created_at: report.created_at,
            is_fallback: true
          });
        });
      }

      // 3. Fetch recent messages
      const { data: globalMsgs } = await supabase.from("global_messages").select("*").limit(5);
      if (globalMsgs) {
        globalMsgs.forEach((msg) => {
          activities.push({
            id: `global-msg-${msg.id}`,
            user_id: null,
            user_name: msg.author_name,
            user_role: msg.author_role || "GLOBAL_ADMIN",
            branch_name: null,
            action_type: "GLOBAL_ANNOUNCEMENT",
            details: `Broadcasted global bulletin: "${msg.content.slice(0, 50)}${msg.content.length > 50 ? "..." : ""}"`,
            created_at: msg.created_at,
            is_fallback: true
          });
        });
      }

      // 4. Fetch Branch messages
      let bMsgQuery = supabase.from("branch_messages").select("*").limit(5);
      if (currentUserBranch) {
        bMsgQuery = bMsgQuery.eq("branch_name", currentUserBranch);
      }
      const { data: branchMsgs } = await bMsgQuery;
      if (branchMsgs) {
        branchMsgs.forEach((msg) => {
          activities.push({
            id: `branch-msg-${msg.id}`,
            user_id: null,
            user_name: msg.author_name,
            user_role: msg.author_role || "BRANCH_ADMIN",
            branch_name: msg.branch_name,
            action_type: "BRANCH_UPDATE",
            details: `Posted local update for ${msg.branch_name}: "${msg.content.slice(0, 50)}${msg.content.length > 50 ? "..." : ""}"`,
            created_at: msg.created_at,
            is_fallback: true
          });
        });
      }

      // 5. Fetch recent profiles for leadership registrations and profile approvals
      let profileQuery = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10);
      if (currentUserBranch) {
        profileQuery = profileQuery.eq("branch_name", currentUserBranch);
      }
      const { data: dbProfiles } = await profileQuery;
      if (dbProfiles) {
        dbProfiles.forEach((p) => {
          if (p.status === "PENDING") {
            activities.push({
              id: `profile-reg-${p.id}`,
              user_id: p.id,
              user_name: p.full_name || "New Leader",
              user_role: p.role || "GLOBAL_ADMIN",
              branch_name: p.branch_name,
              action_type: "LEADER_REGISTERED",
              details: `Leader registration submitted for "${p.full_name}" as ${p.role.replace("_", " ")} in "${p.branch_name || 'N/A'}" branch.`,
              created_at: p.created_at || new Date().toISOString(),
              is_fallback: true
            });
          } else if (p.status === "APPROVED") {
            activities.push({
              id: `profile-app-${p.id}`,
              user_id: p.id,
              user_name: p.full_name || "Leader",
              user_role: p.role || "GLOBAL_ADMIN",
              branch_name: p.branch_name,
              action_type: "PROFILE_APPROVED",
              details: `Leader profile for "${p.full_name}" (${p.role.replace("_", " ")}) has been approved after administrative review.`,
              created_at: p.created_at || new Date().toISOString(),
              is_fallback: true
            });
          }
        });
      }

      // 6. Add any locally logged actions from localStorage
      const localLogs: ActivityLog[] = JSON.parse(localStorage.getItem("local_activity_logs") || "[]");
      localLogs.forEach((log) => {
        // Only include if it matches branch permissions
        if (!currentUserBranch || log.branch_name === currentUserBranch || !log.branch_name) {
          activities.push(log);
        }
      });

    } catch (e) {
      console.warn("Error running fallback aggregator:", e);
    }

    // Sort descending by timestamp
    return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
  }
};
