const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/authMiddleware");

// Enforce server-level ADMIN role authorization across all admin routes
router.use(requireAdmin);

// Verify admin status
router.get("/verify", adminController.verifyAdmin);

// Platform stats & telemetry
router.get("/stats", adminController.getStats);

// User and role management
router.get("/users", adminController.getUsers);
router.put("/users/:id/role", adminController.updateUserRole);

// System activity & audit logs
router.get("/audit-logs", adminController.getAuditLogs);

// Cloud accounts & fleet status
router.get("/cloud-accounts", adminController.getCloudAccounts);

// Platform configuration
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

module.exports = router;
