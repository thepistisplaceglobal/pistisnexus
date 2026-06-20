import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import http from "http";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy initialize Gemini client to avoid crashing when key is absent
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!genAiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 0) {
      genAiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return genAiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // API routing for sending secure emails through Resend
  app.post("/api/send-email", async (req, res) => {
    try {
      const { toEmail, subject, bodyHtml, resendFrom } = req.body;
      const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
      
      if (!resendApiKey) {
        return res.status(500).json({ status: "error", message: "RESEND_API_KEY not configured on server" });
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL || resendFrom || "noreply@thepistisplaceglobal.org";

      console.log(`[Express] Proxying email to Resend API for: ${toEmail} from: ${fromEmail}`);
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: subject,
          html: bodyHtml
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ status: "ok", data });
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("[Express] Resend API Error:", response.status, errData);
        return res.status(response.status).json({ status: "error", message: "Resend API rejected request", details: errData });
      }
    } catch (err: any) {
      console.error("[Express] Failed to parse internal email proxy:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  });

  // API routing for generating dynamic AI insights using @google/genai Gemini API
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { role, branchName, recentData } = req.body || {};
      const client = getGeminiClient();

      if (!client) {
        // Return realistic dynamic simulation state if Gemini key is not configured on server
        console.log(`[Express] GEMINI_API_KEY not configured, serving mock intelligence for ${role}`);
        const mockInsights = getMockInsightsForRole(role, branchName);
        return res.status(200).json({ status: "mock", insights: mockInsights });
      }

      console.log(`[Express] Requesting Gemini AI Insights for role: ${role}, branch: ${branchName}`);
      
      const prompt = `
You are the Executive Administrator AI assistant at The Pistis Place Global Church. 
You are evaluating operational and spiritual progress reports to compile "Executive Intelligence Insights" for our leaders.

Context parameters:
- User Role: ${role || "BRANCH_ADMIN"}
- Branch Name: ${branchName || "Main Campus"}
- Recent Data Context: ${JSON.stringify(recentData || [])}

Generate exactly 3 professional executive insight objects in the following array:
1. One 'positive': An encouraging trend, highlights high performance, fast submissions or substantial growth (e.g. increase in souls reached, fast reporting, cell activity).
2. One 'warning': An operational anomaly or delay (e.g. pending department reports, late submissions, dips in certain metrics).
3. One 'suggestion': Active strategic next steps or administrative suggestions (e.g. reminders, template distribution, training cells).

Be precise, highly professional, realistic and practical. Avoid overly generic answers; craft them specifically for church operations (Home Cells, Interest Groups, Departments, Evangelism, Souls, Inflows, Attendance). Do NOT mention the system/model technical details.
`;

      let hasTimedOut = false;
      let timerId: NodeJS.Timeout | null = null;

      // Run Gemini API with background safety
      const geminiPromise = client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              insights: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: {
                      type: "STRING",
                      description: "Allowed values: 'positive', 'warning', 'suggestion'."
                    },
                    title: {
                      type: "STRING",
                      description: "Short catchy heading for the insight (5-8 words)."
                    },
                    content: {
                      type: "STRING",
                      description: "Detailed description of the insight, recommendation or analysis (20-45 words)."
                    }
                  },
                  required: ["type", "title", "content"]
                }
              }
            },
            required: ["insights"]
          }
        }
      });

      // Prevent Unhandled Promise Rejections when timeout wins the race
      geminiPromise.catch((err) => {
        if (hasTimedOut) {
          console.warn("[Express] Gemini background promise rejected after timeout:", err.message || err);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timerId = setTimeout(() => {
          hasTimedOut = true;
          reject(new Error("Gemini API call timed out after 3500ms"));
        }, 3500);
      });

      const geminiRes = await Promise.race([geminiPromise, timeoutPromise]);
      if (timerId) clearTimeout(timerId);

      const responseText = geminiRes.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini engine");
      }

      const parsed = JSON.parse(responseText.trim());
      return res.status(200).json({ status: "live", insights: parsed.insights });

    } catch (err: any) {
      console.warn("[Express] Gemini API info (serving fallback insights):", err.message || err);
      const { role, branchName } = req.body || {};
      const fallback = getMockInsightsForRole(role || "BRANCH_ADMIN", branchName || "Main Campus");
      return res.status(200).json({ status: "fallback", insights: fallback, error: err.message });
    }
  });

  // Mock generator helper
  function getMockInsightsForRole(role: string, branchName: string) {
    if (role === "GLOBAL_ADMIN") {
      return [
        {
          type: "positive",
          title: "Outreach & Attendance High Correlations",
          content: "Unified global evangelism initiatives report a substantial 18% upsurge in first-time souls across PH, Uyo, and London branches this month."
        },
        {
          type: "warning",
          title: "Slight Midweek Attendance Latency",
          content: "We detected standard report collation latency. Multiple branch departments are completing cell reports up to 4 hours post-deadline."
        },
        {
          type: "suggestion",
          title: "Template Standardization Proposal",
          content: "Distribute successfully tested London outreach cell frameworks globally to standardise leadership operational models across cells."
        }
      ];
    } else {
      return [
        {
          type: "positive",
          title: "Departmental Submissions Surpassing Targets",
          content: `Ushers and Media units in ${branchName || "this branch"} achieved 100% early report milestones, driving high active administrative trust.`
        },
        {
          type: "warning",
          title: "Department Reporting Compliance Alerts",
          content: "Two cell groups and interest fellowships are yet to submit weekly metrics. Deadline limits are active soon."
        },
        {
          type: "suggestion",
          title: "Midweek Spiritual Activation",
          content: "Attendance statistics advise a mild 10% variance. Implementing automated SMS or notification reminders is highly advised."
        }
      ];
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: server
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
