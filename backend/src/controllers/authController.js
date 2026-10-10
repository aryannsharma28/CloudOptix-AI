const authService = require("../services/authService");
const awsCollectorService = require("../services/awsCollectorService");

/**
 * Extract Bearer token from Authorization header or cookie
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return req.headers["x-auth-token"] || null;
};

exports.sendPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: "phoneNumber is required." });
    }

    const result = authService.sendPhoneOtp(phoneNumber);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber, otp, name } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, error: "phoneNumber and otp are required." });
    }

    const result = authService.verifyPhoneOtp(phoneNumber, otp, name);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.googleSignIn = async (req, res) => {
  try {
    const { email, name, picture, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Google email is required." });
    }

    const result = authService.googleSignIn({ email, name, picture, googleId });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const result = authService.loginWithPassword({ email, password });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.registerWithPassword = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const result = authService.registerWithPassword({ email, password, name, role });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: "Not authenticated. No token provided." });
    }

    const user = authService.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: "Session expired or invalid. Please sign in again." });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = extractToken(req);
    const result = authService.logout(token);
    awsCollectorService.disconnect();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: "Not authenticated." });
    }

    const user = authService.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid session." });
    }

    const { name, role, email, phoneNumber } = req.body;
    const result = authService.updateProfile(user.id, { name, role, email, phoneNumber });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = authService.getAllUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
