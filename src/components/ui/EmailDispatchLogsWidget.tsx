import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmailService, EmailDispatch } from "@/services/emailService";
import { Mail, Clock, ShieldCheck, RefreshCw, Eye, X, Send, Key, Settings } from "lucide-react";

export function EmailDispatchLogsWidget() {
  const [logs, setLogs] = useState<EmailDispatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailDispatch | null>(null);
  
  // API Config State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [resendApiKey, setResendApiKey] = useState(localStorage.getItem("VITE_RESEND_API_KEY") || "");
  const [resendFrom, setResendFrom] = useState(localStorage.getItem("VITE_RESEND_FROM_EMAIL") || "onboarding@resend.dev");
  const [configSaved, setConfigSaved] = useState(false);

  // Manual Trigger Test State
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("");
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await EmailService.getEmailDispatchLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    
    // Set up a refresh poll every 10 seconds to detect fresh approvals
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = () => {
    if (resendApiKey) {
      localStorage.setItem("VITE_RESEND_API_KEY", resendApiKey);
    } else {
      localStorage.removeItem("VITE_RESEND_API_KEY");
    }
    localStorage.setItem("VITE_RESEND_FROM_EMAIL", resendFrom);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
    setIsConfigOpen(false);
    fetchLogs();
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testName) return;
    setTesting(true);
    setTestSuccess(null);
    try {
      const response = await EmailService.sendApprovalEmail(
        testEmail,
        testName,
        "DEPT_LEADER",
        "Uyo (HQ)"
      );
      if (response) {
        setTestSuccess("Test Approval Welcome Mail dispatched successfully!");
        setTestEmail("");
        setTestName("");
        await fetchLogs();
      } else {
        setTestSuccess("Failed to dispatch email helper. Check credentials.");
      }
    } catch (err: any) {
      setTestSuccess(`Error: ${err?.message || err}`);
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6" id="email-dispatch-center">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/5 pt-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" /> Executive Outbox & Dispatch Hub
          </h2>
          <p className="text-lilac/80 text-sm">Review, audit, policy-match, and test outbound verification mailings</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchLogs}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Logs
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" /> SMTP / Resend Config
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outbound Logs list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-lilac font-bold">Mail Dispatch Stream</span>
            <span className="text-[10px] bg-white/5 border border-white/10 text-lavender/60 px-2 py-0.5 rounded-full">
              {logs.length} logged
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 text-white/30 italic text-sm border-2 border-dashed border-white/5 bg-white/5 rounded-2xl flex flex-col items-center gap-3">
              <Mail className="w-8 h-8 opacity-20" />
              <p>No dispatch entries tracked. Approve registration or send test to trigger.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {logs.map((log) => {
                const isApprovedTpl = log.template_name === "APPROVAL_CONFIRMATION";
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedEmail(log)}
                    className="group bg-[#110624]/70 border border-white/5 hover:border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 cursor-pointer hover:shadow-[0_4px_15px_rgba(124,58,237,0.1)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg border shrink-0 ${
                        isApprovedTpl 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}>
                        {isApprovedTpl ? <ShieldCheck className="w-4.5 h-4.5" /> : <Key className="w-4.5 h-4.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white group-hover:text-amber-300 text-sm transition-colors">
                            {log.recipient_name}
                          </h4>
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/45">
                            {log.to_email}
                          </span>
                        </div>
                        <p className="text-xs text-lavender/70 line-clamp-1 mt-1 font-medium">{log.subject}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <div className="text-right">
                        <span className={`text-[9px] uppercase tracking-wider font-bold block ${
                          log.status.includes("FAILED") ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-[9px] text-white/30 mt-0.5 block flex items-center justify-end gap-1 font-sans">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <button className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 group-hover:border-purple-500/45 text-white/50 group-hover:text-white text-xs font-bold transition-all flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View HTML
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Test Console Widget */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-mono uppercase tracking-widest text-lilac font-bold px-1">Testing Console</span>
          
          <GlassCard className="p-5 bg-gradient-to-b from-[#110126]/60 to-[#0A0118]/90">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
              <Send className="w-4 h-4 text-purple-400" /> Direct Verification Trigger
            </h3>
            <p className="text-xs text-lavender/70 leading-relaxed mb-4">
              Instantly compile and send visual transactional mail to any verification partner. Validates layouts immediately.
            </p>

            <form onSubmit={handleSendTest} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-lilac block mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Pastor Chidi"
                  className="w-full bg-[#1A0C38]/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-royal-purple"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-lilac block mb-1">Receipt Email</label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="e.g. pastor@pistis.com"
                  className="w-full bg-[#1A0C38]/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-royal-purple"
                />
              </div>

              {testSuccess && (
                <div className={`p-3 rounded-lg text-xs font-medium leading-relaxed ${
                  testSuccess.includes("Failed") || testSuccess.includes("Error")
                    ? "bg-rose-950/20 border border-rose-950/40 text-rose-300"
                    : "bg-emerald-950/20 border border-emerald-950/40 text-emerald-300"
                }`}>
                  {testSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={testing}
                className="w-full bg-royal-purple hover:bg-royal-purple/85 active:bg-royal-purple/75 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {testing ? "Dispatching..." : "Send Branded Approvals Mail"}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* SMTP/Resend Modal Options Configuration */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0F0320] border border-white/15 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5 leading-tight">
                <Settings className="w-4 h-4 text-indigo-400" /> Transactional Mail Delivery
              </h3>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-lavender">
              <p className="text-xs leading-relaxed text-lavender/85">
                Integrate <a href="https://resend.com" target="_blank" className="text-purple-400 hover:text-purple-300 font-bold underline">Resend</a> to pivot from client-side simulation directly to immediate transactional emails for your physical leaders!
              </p>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-lilac block mb-1">
                  Resend API Key (re_...)
                </label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="Enter token starting with re_..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-royal-purple"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-lilac block mb-1">
                  Sender From Address (Approved Domain)
                </label>
                <input
                  type="email"
                  value={resendFrom}
                  onChange={(e) => setResendFrom(e.target.value)}
                  placeholder="onboarding@resend.dev"
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-royal-purple"
                />
              </div>

              <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-950/40 text-[10.5px] leading-relaxed text-purple-300 italic">
                Secure Tip: If not specified, system secures mail logs within the Supabase instance to simulate zero-conflict testing.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/5 pt-3 mt-1">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="bg-transparent border border-white/15 text-white/80 hover:bg-white/5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Skip / Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="bg-royal-purple hover:bg-royal-purple/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Save Live Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive interactive Simulated Mail Window Overlay */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-[90vh] bg-[#0E031E] border border-white/15 rounded-2xl flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header detail */}
            <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {selectedEmail.subject}
                  </h3>
                  <p className="text-xs text-lavender/60">
                    Sent to: <strong className="text-white">{selectedEmail.recipient_name}</strong> ({selectedEmail.to_email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Body Iframe sandbox preview Frame */}
            <div className="flex-1 bg-white p-4 overflow-y-auto">
              {/* Using srcDoc inside an isolated, non-editable iframe sandbox to render CSS and markup 100% cleanly */}
              <iframe
                title="Email Frame Preview"
                srcDoc={selectedEmail.body_html}
                className="w-full h-full border-0 rounded-lg bg-slate-950"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
              />
            </div>

            {/* Close footer controls */}
            <div className="p-3 bg-[#0B0118] border-t border-white/5 flex justify-between items-center px-5 text-xs text-lavender/40">
              <span>Timestamp: {new Date(selectedEmail.created_at).toLocaleString()}</span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="bg-royal-purple hover:bg-royal-purple/90 text-white px-5 py-2 rounded-lg font-bold transition-all cursor-pointer"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
