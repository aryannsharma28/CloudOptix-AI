const authService = require("../services/authService");
const awsCollectorService = require("../services/awsCollectorService");

// In-memory platform configuration with defaults
let platformSettings = {
  autoSyncIntervalMinutes: 15,
  maxAnomalySensitivity: 0.85,
  readOnlyEnforcement: true,
  alertWebhookUrl: "",
  emailAlertsEnabled: true,
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM"
};

/**
 * Verifies admin credentials and returns admin profile
 */
exports.verifyAdmin = async (req, res) => {
  res.json({
    success: true,
    message: "Authorized as administrator.",
    admin: req.user
  });
};

/**
 * Returns platform-level overview metrics using REAL application data
 */
exports.getStats = async (req, res) => {
  try {
    const users = authService.getAllUsers();
    const mode = awsCollectorService.getMode();
    const accountInfo = awsCollectorService.getAccountInfo();
    const summary = await awsCollectorService.getSummary();
    const recommendations = await awsCollectorService.getRecommendations();

    const memUsage = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    const activeSessionsCount = authService.sessions.size;

    const stats = {
      totalUsers: users.length,
      activeUsers: activeSessionsCount || (users.filter((u) => u.lastLoginAt).length || 1),
      connectedCloudAccounts: mode === "LIVE_AWS" ? 1 : 0,
      cloudConnectionMode: mode,
      cloudAccount: accountInfo,
      totalCloudSpend: summary.monthlyCost || 0,
      potentialSavings: summary.potentialSavings || 0,
      optimizationOpportunities: recommendations.filter((r) => !r.applied && !r.closed).length,
      activeResourcesCount: summary.activeResources || 0,
      systemHealth: {
        status: "OPERATIONAL",
        mode,
        uptimeSeconds: uptimeSec,
        uptimeHuman: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
        memoryRssMb: Math.round(memUsage.rss / 1024 / 1024),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || "development",
        lastTelemetrySync: new Date().toISOString()
      },
      userBreakdown: {
        admins: users.filter((u) => authService.isAdmin(u)).length,
        finopsLeads: users.filter((u) => u.role === "FINOPS_LEAD" || u.role === "FinOps Lead").length,
        standardUsers: users.filter((u) => u.role === "USER" || (!authService.isAdmin(u) && u.role !== "FINOPS_LEAD" && u.role !== "FinOps Lead")).length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List all users with roles
 */
exports.getUsers = async (req, res) => {
  try {
    const users = authService.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Updates a user's role (ADMIN, FINOPS_LEAD, USER)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: "Role is required." });
    }

    const result = authService.updateUserRole(id, role);
    authService.logAudit(
      "ADMIN_ROLE_CHANGE",
      req.user.id,
      `Administrator ${req.user.email || req.user.name} changed role of user ${id} to ${role}.`
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * System audit logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = authService.getAuditLogs();
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Connected cloud accounts overview
 */
exports.getCloudAccounts = async (req, res) => {
  try {
    const mode = awsCollectorService.getMode();
    const accountInfo = awsCollectorService.getAccountInfo();
    const summary = await awsCollectorService.getSummary();

    const accounts = [];
    if (mode === "LIVE_AWS" && accountInfo) {
      accounts.push({
        id: "aws-live-prod",
        provider: "AWS",
        alias: accountInfo.accountAlias || "aws-production-fleet",
        region: accountInfo.primaryRegion || "ap-south-1",
        connectionType: accountInfo.connectionType || "IAM Read-Only",
        status: "CONNECTED",
        monthlySpend: summary.monthlyCost || 0,
        resourcesCount: summary.activeResources || 0,
        lastHeartbeat: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      mode,
      count: accounts.length,
      data: accounts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Platform settings
 */
exports.getSettings = async (req, res) => {
  res.json({
    success: true,
    data: platformSettings
  });
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body || {};
    platformSettings = {
      ...platformSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email || req.user.name
    };

    authService.logAudit(
      "ADMIN_SETTINGS_UPDATE",
      req.user.id,
      `Platform settings updated by ${req.user.email || req.user.name}.`
    );

    res.json({
      success: true,
      message: "Platform settings updated successfully.",
      data: platformSettings
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
