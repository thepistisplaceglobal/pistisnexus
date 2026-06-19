import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import http from "http";

dotenv.config();

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

      console.log(`[Express] Proxying email to Resend API for: ${toEmail}`);
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: resendFrom || "noreply@thepistisplaceglobal.org",
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
