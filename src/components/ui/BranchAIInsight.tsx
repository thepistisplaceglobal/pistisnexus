import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

interface InsightData {
  type: "positive" | "warning" | "suggestion" | "info";
  title: string;
  content: string;
}

export function BranchAIInsight() {
  const { user } = useAppStore();
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [engineStatus, setEngineStatus] = useState<"live" | "mock" | "fallback" | "idle">("idle");

  const loadAIInsights = async () => {
    setLoading(true);
    setStatusText("Auditing reporting logs...");
    try {
      // 1. Fetch recent unit and branch reports to build authentic context
      let recentData: any[] = [];
      try {
        const query = supabase
          .from("unit_reports")
          .select("id, status, created_at, unit_name, metrics")
          .order("created_at", { ascending: false })
          .limit(8);

        if (user?.role === "BRANCH_ADMIN" && user.branchName) {
          query.eq("branch_name", user.branchName);
        }

        const { data } = await query;
        if (data) {
          recentData = data.map((d: any) => ({
            unit: d.unit_name,
            status: d.status,
            attendance: d.metrics?.attendance || 0,
            souls_won: d.metrics?.souls_won || d.metrics?.soulsWon || 0,
            date: d.created_at,
          }));
        }
      } catch (e) {
        console.warn("Failed to gather db context metrics for Gemini, using fallback:", e);
      }

      setStatusText("Synthesizing Pistis AI recommendations...");

      // 2. Fetch from our backend proxy
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: user?.role || "BRANCH_ADMIN",
          branchName: user?.branchName || "Main Campus",
          recentData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInsights(result.insights || []);
        setEngineStatus(result.status || "live");
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (err) {
      console.error("AI Insight fetch error:", err);
      // Local graceful fallback
      setInsights([
        {
          type: "positive",
          title: "Early Report Turnaround Success",
          content: "Active units achieved milestone report deliveries promptly. Ensure positive feedback tags are attached automatically."
        },
        {
          type: "warning",
          title: "Activity Submission Alignment Alert",
          content: "Spiritual and physical growth indicators require double verification. Some reports did not submit detailed outreach metrics."
        },
        {
          type: "suggestion",
          title: "Digital Reminder System Pulse",
          content: "Schedule systematic SMS reminders to optimize coordination latency for Home Cell and Department leads."
        }
      ]);
      setEngineStatus("fallback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIInsights();
  }, [user]);

  return (
    <GlassCard className="flex flex-col gap-4 bg-gradient-to-br from-[#0B0118]/80 to-royal-purple/10 border-white/5 relative overflow-hidden">
      {/* Visual glow element */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#d8b4fe]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-lilac/90 animate-pulse" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-lilac">
            Branch Intelligence Desk
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {engineStatus === "live" && (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pistis AI
            </span>
          )}
          {(engineStatus === "mock" || engineStatus === "fallback" || engineStatus === "idle") && (
            <span className="text-[10px] bg-purple-500/15 text-[#d8b4fe] font-bold border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              Pistis AI (Sandbox Engine)
            </span>
          )}

          <button
            onClick={loadAIInsights}
            disabled={loading}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
            title="Refresh Intelligence Insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#d8b4fe] animate-spin" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-white/95">{statusText}</p>
            <p className="text-[10px] text-white/40">Aggregating branch metrics & running diagnostic flow</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map((insight, idx) => {
            let Icon;
            let colorClass;
            let bgClass;
            let borderClass;

            switch (insight.type) {
              case "positive":
                Icon = TrendingUp;
                colorClass = "text-emerald-400";
                bgClass = "bg-emerald-400/10";
                borderClass = "border-emerald-500/10";
                break;
              case "warning":
                Icon = AlertTriangle;
                colorClass = "text-amber-400";
                bgClass = "bg-amber-400/10";
                borderClass = "border-amber-500/10";
                break;
              case "suggestion":
              default:
                Icon = Lightbulb;
                colorClass = "text-lavender";
                bgClass = "bg-lavender/10";
                borderClass = "border-royal-purple/15";
                break;
            }

            return (
              <div 
                key={idx} 
                className={`flex gap-3 items-start p-3.5 rounded-xl border ${borderClass} bg-black/15 hover:bg-black/25 transition-colors`}
              >
                <div className={`p-2 rounded-xl ${bgClass} ${colorClass} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white tracking-wide">{insight.title}</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {insight.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
