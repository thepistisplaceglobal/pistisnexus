import { useState } from "react";
import { GlassCard } from "./GlassCard";
import { ActionButton } from "./ActionButton";
import { X, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { ActivityService } from "@/services/activityService";

interface WeeklyReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyReportFormModal({ isOpen, onClose }: WeeklyReportFormModalProps) {
  const user = useAppStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingHeld, setMeetingHeld] = useState<"Yes" | "No" | "">("");

  if (!isOpen || !user) return null;

  const role = user.role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const unitName = user.deptName || user.groupName || 'Unknown Unit';
      const unitType = role === 'DEPT_LEADER' ? 'DEPT' : role === 'CELL_LEADER' ? 'CELL' : 'INTEREST_GROUP';
      const branchName = user.branchName || 'Unknown Branch';

      await supabase.from('unit_reports').insert([{
        unit_name: unitName,
        unit_type: unitType,
        branch_name: branchName,
        submitter_name: user.name,
        metrics: {
          meetingHeld,
          // In a real app we'd capture all form states here, for this MVP we stub the body.
          submitted_at: new Date().toISOString()
        },
        status: 'PENDING_BRANCH'
      }]);

      await ActivityService.logActivity({
        user_id: user.id,
        user_name: user.name,
        user_role: role,
        branch_name: branchName,
        action_type: "REPORT_SUBMITTED",
        details: `Submitted weekly metrics report for ${unitType === 'CELL' ? 'Cell' : unitType === 'DEPT' ? 'Department' : 'Interest Group'} "${unitName}".`
      });
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
    onClose();
  };

  const isFollowUp = user.deptName?.toLowerCase().includes("follow");

  const renderDepartmentFields = () => (
    <>
      <div className="space-y-4 pt-2 border-t border-white/10">
        <h4 className="text-sm font-semibold text-lilac uppercase tracking-wider">General Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Focus for the week" type="text" />
          <FormField label="Achievement for the week" type="text" />
          <FormField label="Challenges encountered" type="text" />
          <FormField label="What's the way out" type="text" />
          <div className="md:col-span-2">
            <FormField label="Actions taken to better focus members on the ministry's vision and goals" type="textarea" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-lilac uppercase tracking-wider">Meetings & Attendance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs text-lavender/70 font-medium">Did your department have their weekly meeting this week?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white text-sm">
                <input type="radio" name="meetingHeld" value="Yes" onChange={() => setMeetingHeld("Yes")} className="accent-royal-purple" /> Yes
              </label>
              <label className="flex items-center gap-2 text-white text-sm">
                <input type="radio" name="meetingHeld" value="No" onChange={() => setMeetingHeld("No")} className="accent-royal-purple" /> No
              </label>
            </div>
          </div>
          {meetingHeld === "No" && (
            <div className="md:col-span-2">
              <FormField label="If No, why?" type="text" />
            </div>
          )}
          <FormField label="Total number of department workers" type="number" />
          <FormField label="Total number available for workforce meeting" type="number" />
          <FormField label="Total number available for Friday service" type="number" />
          <FormField label="Total number available for Sunday service" type="number" />
          <FormField label="How many people joined your unit this week?" type="number" />
          <div className="md:col-span-2">
            <FormField label="List of department workers that were absent" type="textarea" />
          </div>
        </div>
      </div>

      {isFollowUp ? (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-semibold text-lilac uppercase tracking-wider">Follow-Up & Guest Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Number of first-time guests" type="number" />
            <FormField label="Number of returning guests" type="number" />
            <FormField label="Total converted to members" type="number" />
            <FormField label="Total calls made this week" type="number" />
            <div className="md:col-span-2">
              <FormField label="General observations & guest feedback" type="textarea" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-semibold text-lilac uppercase tracking-wider">Evangelism Report</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="When did your department engage in evangelism this week" type="text" />
            <FormField label="Unit evangelism target for the week" type="number" />
            <FormField label="Number of people reached" type="number" />
            <FormField label="How many came on Friday" type="number" />
            <FormField label="How many came on Sunday" type="number" />
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-lilac uppercase tracking-wider">Finance Report</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Opening balance (₦)" type="number" />
          <FormField label="Dues / partnership received this week (₦)" type="number" />
          <div className="md:col-span-2">
            <FormField label="List of expenditure & amount for the week" type="textarea" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-lilac uppercase tracking-wider">Additional Information</h4>
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Are there needs or concerns for your department that you'd like the ministry to know about?" type="textarea" />
          <FormField label="What are your departmental goals for next week?" type="textarea" />
        </div>
      </div>
    </>
  );

  const renderCellFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10 mt-2">
        <div className="md:col-span-2">
          <FormField label="Focus for the week" type="text" />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs text-lavender/70 font-medium">Meeting held this week?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" name="cellMeeting" value="Yes" onChange={() => setMeetingHeld("Yes")} className="accent-royal-purple" /> Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" name="cellMeeting" value="No" onChange={() => setMeetingHeld("No")} className="accent-royal-purple" /> No
            </label>
          </div>
        </div>
        {meetingHeld === "No" && (
          <div className="md:col-span-2">
            <FormField label="If No, why?" type="text" />
          </div>
        )}
        <FormField label="Total membership" type="number" />
        <FormField label="Number of members present" type="number" />
        <FormField label="Number of first timers" type="number" />
        <FormField label="New converts" type="number" />
        <div className="md:col-span-2">
          <FormField label="Evangelism details / Locations" type="textarea" />
        </div>
        <FormField label="Cell offering amount (₦)" type="number" />
        <div className="md:col-span-2">
          <FormField label="General remarks & prayer requests" type="textarea" />
        </div>
      </div>
    </>
  );

  const renderInterestGroupFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10 mt-2">
        <div className="md:col-span-2">
          <FormField label="Focus for the week" type="text" />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs text-lavender/70 font-medium">Meeting / Activity held this week?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" name="igMeeting" value="Yes" onChange={() => setMeetingHeld("Yes")} className="accent-royal-purple" /> Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" name="igMeeting" value="No" onChange={() => setMeetingHeld("No")} className="accent-royal-purple" /> No
            </label>
          </div>
        </div>
        {meetingHeld === "No" && (
          <div className="md:col-span-2">
            <FormField label="If No, why?" type="text" />
          </div>
        )}
        <FormField label="Total active members" type="number" />
        <FormField label="Total attendance" type="number" />
        <div className="md:col-span-2">
          <FormField label="Progress of group projects" type="textarea" />
        </div>
        <div className="md:col-span-2">
          <FormField label="Upcoming events / plans" type="textarea" />
        </div>
        <div className="md:col-span-2">
          <FormField label="Requests for support from ministry" type="textarea" />
        </div>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-3xl"
        >
          <GlassCard className="p-0 flex flex-col max-h-[90vh] overflow-hidden bg-gradient-to-b from-[#0B0118] to-[#12042A]">
            <div className="p-6 md:p-8 flex justify-between items-start shrink-0 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Weekly Ministry Report
                </h2>
                <div className="text-sm text-lavender/60 mt-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-semibold text-lilac bg-white/5 py-1 px-2 rounded">
                    Date: {new Date().toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-lilac bg-white/5 py-1 px-2 rounded">
                    {role === "DEPT_LEADER" ? "Department" : role === "CELL_LEADER" ? "Home Cell" : "Interest Group"}: {user.deptName || user.groupName || "N/A"}
                  </span>
                  <span className="font-semibold text-lilac bg-white/5 py-1 px-2 rounded">
                    Leader: {user.name}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white/50 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col gap-6">
              {role === "DEPT_LEADER" && renderDepartmentFields()}
              {role === "CELL_LEADER" && renderCellFields()}
              {role === "INTEREST_GROUP_LEADER" && renderInterestGroupFields()}
            </form>

            <div className="p-4 md:p-6 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-black/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <ActionButton onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report to Branch"}
              </ActionButton>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, type = "text" }: { label: string; type?: "text" | "number" | "textarea" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-lavender/70 font-medium">{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={3}
          className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-royal-purple resize-none text-sm placeholder-white/20"
          placeholder="Enter details..."
          required
        />
      ) : (
        <input
          type={type}
          className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-royal-purple text-sm placeholder-white/20"
          placeholder={`Enter ${label.toLowerCase()}...`}
          required
        />
      )}
    </div>
  );
}
