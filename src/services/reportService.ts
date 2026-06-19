import { supabase } from "@/lib/supabase";
import { ActivityService } from "@/services/activityService";

export interface UnitReport {
  id: string;
  unit_name: string;
  unit_type: string;
  branch_name: string;
  submitted_by: string | null;
  submitter_name: string;
  metrics: any;
  status: string;
  minutes?: string;
  created_at: string;
}

export interface BranchReport {
  id: string;
  branch_name: string;
  submitted_by: string | null;
  submitter_name: string;
  metrics: any;
  status: string;
  minutes?: string;
  created_at: string;
}

export interface BranchReportSummary {
  totalAttendance: number;
  totalIncome: number;
  totalExpenses: number;
  firstTimeGuests: number;
  returningGuests: number;
  departmentStatus: { name: string; verified: boolean }[];
  cellsStatus: { submitted: number; total: number };
  verifiedUnitIds: string[];
}

export const ReportService = {
  /**
   * Automates fetching all pending unit reports for a specific branch.
   */
  async getPendingUnitReports(branchName: string): Promise<UnitReport[]> {
    const { data, error } = await supabase
      .from('unit_reports')
      .select('*')
      .eq('branch_name', branchName)
      .eq('status', 'PENDING_BRANCH')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching pending unit reports:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Fetches all unit reports for a specific branch (including approved ones).
   */
  async getBranchUnitReports(branchName: string): Promise<UnitReport[]> {
    const { data, error } = await supabase
      .from('unit_reports')
      .select('*')
      .eq('branch_name', branchName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching branch unit reports:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Fetches all pending branch reports for the Global HQ audit.
   */
  async getPendingBranchReports(): Promise<BranchReport[]> {
    const { data, error } = await supabase
      .from('branch_reports')
      .select('*')
      .eq('status', 'PENDING_HQ')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching pending branch reports:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Fetches all approved/archived branch reports.
   */
  async getArchivedBranchReports(): Promise<BranchReport[]> {
    const { data, error } = await supabase
      .from('branch_reports')
      .select('*')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching archived branch reports:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Updates status and adds minutes/feedback to a branch report.
   */
  async updateBranchReportStatus(id: string, status: string, minutes?: string): Promise<boolean> {
    try {
      const updatePayload: any = { status };
      if (minutes !== undefined) {
        updatePayload.minutes = minutes;
      }
      const { error } = await supabase
        .from('branch_reports')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        // Fallback: If 'minutes' column isn't inside DB schema yet, we can save in metrics as fallback
        const { data: current } = await supabase.from('branch_reports').select('metrics').eq('id', id).single();
        if (current) {
          const updatedMetrics = { ...current.metrics, minutes };
          await supabase
            .from('branch_reports')
            .update({ status, metrics: updatedMetrics })
            .eq('id', id);
        } else {
          throw error;
        }
      }
      return true;
    } catch (err) {
      console.error("Error updating branch report:", err);
      return false;
    }
  },

  /**
   * Updates status and adds minutes/feedback to a unit report.
   */
  async updateUnitReportStatus(id: string, status: string, minutes?: string): Promise<boolean> {
    try {
      const updatePayload: any = { status };
      if (minutes !== undefined) {
        updatePayload.minutes = minutes;
      }
      const { error } = await supabase
        .from('unit_reports')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        // Fallback to storing in metrics JSON
        const { data: current } = await supabase.from('unit_reports').select('metrics').eq('id', id).single();
        if (current) {
          const updatedMetrics = { ...current.metrics, minutes };
          await supabase
            .from('unit_reports')
            .update({ status, metrics: updatedMetrics })
            .eq('id', id);
        } else {
          throw error;
        }
      }
      return true;
    } catch (err) {
      console.error("Error updating unit report:", err);
      return false;
    }
  },

  /**
   * Automates compiling unit reports into a Branch Report summary for the week.
   */
  async compileBranchSummary(branchName: string): Promise<BranchReportSummary> {
    const { data: reports, error } = await supabase
      .from('unit_reports')
      .select('*')
      .eq('branch_name', branchName);

    if (error) {
      console.error("Error compiling branch summary:", error);
    }

    let totalAttendance = 0;
    let totalIncome = 0;
    let totalExpenses = 0;
    let firstTimeGuests = 0;
    let returningGuests = 0;
    const departmentStatus: { name: string; verified: boolean }[] = [];
    const verifiedUnitIds: string[] = [];
    let cellsSubmitted = 0;
    const expectedCellsInfo = 8; // Stub: Expected 8 cells per branch
    
    // Default expected departments for a branch
    const defaultDepartments = ["Media Department", "Choir", "Ushering Dept"];
    const verifiedDeps = new Set<string>();

    if (reports && reports.length > 0) {
      reports.forEach(report => {
        verifiedUnitIds.push(report.id);
        
        // Extract generic text/number values if structure is loose
        const metrics = report.metrics || {};
        
        // Attempt to parse out some attendance/finance values dynamically:
        // Normally, these keys come from the WeeklyReportFormModal submission.
        const attendanceStr = metrics["Total number of department workers"] || metrics["Total attendance"] || metrics["Total membership"] || "0";
        totalAttendance += parseInt(String(attendanceStr).replace(/,/g, ''), 10) || 0;

        const incomeStr = metrics["Opening balance (₦)"] || metrics["Cell offering amount (₦)"] || "0";
        totalIncome += parseInt(String(incomeStr).replace(/,/g, ''), 10) || 0;

        // Parse Follow-up specific metrics
        const ftgStr = metrics["Number of first-time guests"] || "0";
        firstTimeGuests += parseInt(String(ftgStr).replace(/,/g, ''), 10) || 0;

        const rgStr = metrics["Number of returning guests"] || "0";
        returningGuests += parseInt(String(rgStr).replace(/,/g, ''), 10) || 0;

        if (report.unit_type === "DEPT") {
          verifiedDeps.add(report.unit_name);
        } else if (report.unit_type === "CELL") {
          cellsSubmitted += 1;
        }
      });
    }

    defaultDepartments.forEach(dep => {
      departmentStatus.push({
        name: dep,
        verified: verifiedDeps.has(dep) || false
      });
    });

    // Mock realistic logic for missing data
    if (totalAttendance === 0 && reports?.length === 0) {
        totalAttendance = 0;
    }

    return {
      totalAttendance,
      totalIncome,
      totalExpenses, // In real app, loop and calculate
      firstTimeGuests,
      returningGuests,
      departmentStatus,
      cellsStatus: { submitted: cellsSubmitted, total: expectedCellsInfo },
      verifiedUnitIds
    };
  },

  /**
   * Auto-approve all compiled unit reports and insert a branch report
   */
  async approveAndSubmitBranchReport(
    branchName: string, 
    submitterName: string, 
    compiledSummary: BranchReportSummary, 
    manualData: { inflow: number; expenses: number; generalNote: string }
  ) {
    // 1. Submit the Branch Report to Global HQ
    const { error: branchErr } = await supabase.from('branch_reports').insert([{
        branch_name: branchName,
        submitter_name: submitterName,
        metrics: {
          attendance: compiledSummary.totalAttendance,
          compiled_income: compiledSummary.totalIncome,
          first_time_guests: compiledSummary.firstTimeGuests,
          returning_guests: compiledSummary.returningGuests,
          inflow: manualData.inflow,
          expenses: manualData.expenses,
          generalNote: manualData.generalNote,
          cellsStatus: compiledSummary.cellsStatus
        },
        status: 'PENDING_HQ'
    }]);

    if (branchErr) throw branchErr;

    // 2. Automate updating the unit reports to ARCHIVED or APPROVED status
    if (compiledSummary.verifiedUnitIds.length > 0) {
      await supabase
        .from('unit_reports')
        .update({ status: 'APPROVED_BY_BRANCH' })
        .in('id', compiledSummary.verifiedUnitIds);
    }

    // 3. Log the activity feed entry
    await ActivityService.logActivity({
      user_name: submitterName,
      user_role: "BRANCH_ADMIN",
      branch_name: branchName,
      action_type: "BRANCH_REPORT_COMPILED",
      details: `Consolidated & approved ${compiledSummary.verifiedUnitIds.length} unit reports and submitted the weekly Branch report for "${branchName}".`
    });
  }
};
