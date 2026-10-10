const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Routes
app.use("/api", apiRoutes);
app.use("/api/admin", adminRoutes);

// Root information endpoint
app.get("/", (req, res) => {
  res.json({
    platform: "CloudOptix AI",
    purpose: "AI-Powered Cloud Cost Optimization & Resource Management Platform",
    docs: "/api/health",
    endpoints: [
      "/api/summary",
      "/api/resources",
      "/api/recommendations",
      "/api/forecast",
      "/api/anomalies",
      "/api/security",
      "/api/k8s"
    ]
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`🚀 CloudOptix Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
