const authService = require("../services/authService");

/**
 * Extract Bearer token from Authorization header or custom header
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return req.headers["x-auth-token"] || null;
};

/**
 * Require valid authenticated session token
 */
const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in to access this resource."
    });
  }

  const user = authService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Session expired or invalid. Please sign in again."
    });
  }

  req.user = user;
  req.token = token;
  next();
};

/**
 * Require ADMIN role verification at the server level
 */
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!authService.isAdmin(req.user)) {
      authService.logAudit(
        "UNAUTHORIZED_ADMIN_ACCESS",
        req.user.id,
        `User ${req.user.email || req.user.phoneNumber} (role: ${req.user.role}) attempted to access admin endpoint: ${req.originalUrl}`,
        "WARN"
      );
      return res.status(403).json({
        success: false,
        error: "Access denied. Administrator privileges required."
      });
    }
    next();
  });
};

module.exports = {
  extractToken,
  requireAuth,
  requireAdmin
};
