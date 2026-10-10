const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class AuthService {
  constructor() {
    this.storageDir = path.join(__dirname, "..", "data");
    this.storagePath = path.join(this.storageDir, "users.json");

    // In-memory state with persistence
    this.users = new Map();
    this.sessions = new Map(); // token -> { userId, expiresAt }
    this.activeOtps = new Map(); // phoneNumber -> { otp, expiresAt, lastSentAt, attempts }
    this.auditLogs = []; // System audit logs

    this._ensureStorage();
    this._loadUsers();
    this._ensureDefaultAdmin();
  }

  _ensureStorage() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      if (!fs.existsSync(this.storagePath)) {
        fs.writeFileSync(this.storagePath, JSON.stringify([], null, 2), "utf-8");
      }
    } catch (err) {
      console.warn("Could not initialize users.json storage:", err.message);
    }
  }

  _loadUsers() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, "utf-8");
        const list = JSON.parse(raw);
        for (const u of list) {
          this.users.set(u.id, u);
        }
      }
    } catch (err) {
      console.warn("Error loading users from disk:", err.message);
    }
  }

  _saveUsers() {
    try {
      const list = Array.from(this.users.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.warn("Error persisting users to disk:", err.message);
    }
  }

  /**
   * Normalizes phone number to standard format
   */
  normalizePhoneNumber(phone) {
    if (!phone) return "";
    let clean = phone.replace(/[\s\-\(\)]/g, "");
    if (!clean.startsWith("+")) {
      // Default to India (+91) if 10 digits
      if (clean.length === 10) {
        clean = "+91" + clean;
      } else {
        clean = "+" + clean;
      }
    }
    return clean;
  }

  /**
   * Generates and dispatches a 6-digit OTP for phone login
   */
  sendPhoneOtp(rawPhone) {
    const phoneNumber = this.normalizePhoneNumber(rawPhone);
    if (!phoneNumber || phoneNumber.length < 8) {
      throw new Error("Please enter a valid mobile phone number with country code.");
    }

    const existingOtpData = this.activeOtps.get(phoneNumber);
    const now = Date.now();

    // Rate limit: prevent spamming within 30 seconds
    if (existingOtpData && now - existingOtpData.lastSentAt < 30 * 1000) {
      const waitSec = Math.ceil((30 * 1000 - (now - existingOtpData.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec}s before requesting a new OTP.`);
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

    this.activeOtps.set(phoneNumber, {
      otp,
      expiresAt,
      lastSentAt: now,
      attempts: 0
    });

    console.log(`\n======================================================`);
    console.log(`📲 [CloudOptix SMS Gateway] OTP DISPATCHED`);
    console.log(`Recipient: ${phoneNumber}`);
    console.log(`Security Code (OTP): >>> ${otp} <<<`);
    console.log(`Expires in: 5 minutes (Valid until: ${new Date(expiresAt).toLocaleTimeString()})`);
    console.log(`======================================================\n`);

    return {
      success: true,
      phoneNumber,
      expiresInSeconds: 300,
      message: `6-digit OTP generated and sent to ${phoneNumber}.`,
      otp // Provided so dev and browser testing can preview and auto-fill easily
    };
  }

  /**
   * Verifies the 6-digit OTP and authenticates the user
   */
  verifyPhoneOtp(rawPhone, enteredOtp, displayName = null) {
    const phoneNumber = this.normalizePhoneNumber(rawPhone);
    if (!phoneNumber) {
      throw new Error("Phone number is required.");
    }

    const otpRecord = this.activeOtps.get(phoneNumber);
    if (!otpRecord) {
      throw new Error("No active OTP found for this phone number. Please request an OTP first.");
    }

    if (Date.now() > otpRecord.expiresAt) {
      this.activeOtps.delete(phoneNumber);
      throw new Error("OTP has expired. Please request a new verification code.");
    }

    otpRecord.attempts++;
    if (otpRecord.attempts > 5) {
      this.activeOtps.delete(phoneNumber);
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    const cleanEntered = String(enteredOtp || "").trim();
    if (cleanEntered !== otpRecord.otp) {
      throw new Error("Invalid OTP code. Please enter the correct 6-digit verification code.");
    }

    // OTP is valid! Delete used OTP
    this.activeOtps.delete(phoneNumber);

    // Find existing user or create a new user profile
    let user = Array.from(this.users.values()).find((u) => u.phoneNumber === phoneNumber);

    const nowIso = new Date().toISOString();
    if (!user) {
      const userId = "usr_" + crypto.randomBytes(8).toString("hex");
      const defaultName = displayName || `AWS Cloud Engineer (${phoneNumber.slice(-4)})`;
      user = {
        id: userId,
        authProvider: "PHONE_OTP",
        phoneNumber,
        email: null,
        name: defaultName,
        role: "Cloud Administrator",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=10b981&color=fff&bold=true`,
        createdAt: nowIso,
        lastLoginAt: nowIso
      };
      this.users.set(user.id, user);
      this._saveUsers();
    } else {
      user.lastLoginAt = nowIso;
      if (displayName && displayName.trim()) {
        user.name = displayName.trim();
      }
      this._saveUsers();
    }

    // Issue session token
    const token = this._createSession(user.id);

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user
    };
  }

  /**
   * Google (Gmail) Sign-In / Registration
   */
  googleSignIn({ email, name, picture, googleId }) {
    if (!email || !email.includes("@")) {
      throw new Error("A valid Google (Gmail) address is required.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = Array.from(this.users.values()).find((u) => u.email === normalizedEmail);

    const nowIso = new Date().toISOString();
    const finalName = name || normalizedEmail.split("@")[0];
    const avatarUrl =
      picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=0284c7&color=fff&bold=true`;

    if (!user) {
      const userId = "usr_" + crypto.randomBytes(8).toString("hex");
      const isOwner = normalizedEmail === "aryan.cloud@gmail.com";
      user = {
        id: userId,
        authProvider: "GOOGLE",
        email: normalizedEmail,
        googleId: googleId || "g_" + crypto.randomBytes(6).toString("hex"),
        phoneNumber: null,
        name: finalName,
        role: isOwner ? "ADMIN" : "FinOps Lead",
        avatar: avatarUrl,
        createdAt: nowIso,
        lastLoginAt: nowIso
      };
      this.users.set(user.id, user);
      this._saveUsers();
    } else {
      user.lastLoginAt = nowIso;
      if (name) user.name = name;
      if (picture) user.avatar = picture;
      if (normalizedEmail === "aryan.cloud@gmail.com") {
        user.role = "ADMIN";
      }
      this._saveUsers();
    }

    const token = this._createSession(user.id);

    return {
      success: true,
      message: `Signed in successfully via Google as ${user.email}`,
      token,
      user
    };
  }

  /**
   * Creates an authenticated user session
   */
  _createSession(userId) {
    const token = "coptix_" + crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    this.sessions.set(token, {
      userId,
      expiresAt
    });
    return token;
  }

  _hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  }

  verifyPassword(user, password) {
    if (!user.passwordHash || !user.passwordSalt) return false;
    const testHash = this._hashPassword(password, user.passwordSalt);
    return testHash === user.passwordHash;
  }

  _sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, passwordSalt, ...safe } = user;
    return safe;
  }

  _ensureDefaultAdmin() {
    const adminEmail = "admin@cloudoptix.ai";
    const existing = Array.from(this.users.values()).find((u) => u.email === adminEmail);
    if (!existing) {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = this._hashPassword("Admin@12345", salt);
      const adminUser = {
        id: "usr_admin_master_001",
        authProvider: "PASSWORD",
        email: adminEmail,
        passwordHash: hash,
        passwordSalt: salt,
        phoneNumber: null,
        name: "CloudOptix Admin",
        role: "ADMIN",
        avatar: "https://ui-avatars.com/api/?name=CloudOptix+Admin&background=0f172a&color=f97316&bold=true",
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      this.users.set(adminUser.id, adminUser);
      this._saveUsers();
      this.logAudit("SYSTEM_INIT", "SYSTEM", "Default platform administrator account initialized.");
    } else if (existing.role !== "ADMIN") {
      existing.role = "ADMIN";
      this._saveUsers();
    }

    // Ensure primary project owner aryan.cloud@gmail.com is granted ADMIN role
    const aryan = Array.from(this.users.values()).find((u) => u.email === "aryan.cloud@gmail.com");
    if (aryan && aryan.role !== "ADMIN") {
      aryan.role = "ADMIN";
      this._saveUsers();
    }
  }

  isAdmin(user) {
    if (!user) return false;
    const r = String(user.role || "").toUpperCase();
    const email = String(user.email || "").toLowerCase();
    return (
      r === "ADMIN" ||
      r === "CLOUD ADMINISTRATOR" ||
      email === "admin@cloudoptix.ai" ||
      email === "aryan.cloud@gmail.com"
    );
  }

  logAudit(action, actorId, details, severity = "INFO") {
    const entry = {
      id: "aud_" + crypto.randomBytes(6).toString("hex"),
      timestamp: new Date().toISOString(),
      action,
      actorId,
      details,
      severity
    };
    this.auditLogs.unshift(entry);
    // Keep max 200 logs in memory
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    return entry;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  loginWithPassword({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = Array.from(this.users.values()).find((u) => u.email === cleanEmail);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (!user.passwordHash) {
      throw new Error(`This account was registered via ${user.authProvider}. Please sign in using your original method.`);
    }

    if (!this.verifyPassword(user, password)) {
      this.logAudit("AUTH_FAILURE", cleanEmail, "Failed password sign-in attempt.", "WARN");
      throw new Error("Invalid email or password.");
    }

    user.lastLoginAt = new Date().toISOString();
    this._saveUsers();

    const token = this._createSession(user.id);
    this.logAudit("USER_LOGIN", user.id, `User ${user.email} (${user.role}) authenticated successfully via password.`);

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: this._sanitizeUser(user)
    };
  }

  registerWithPassword({ email, password, name, role = "USER" }) {
    if (!email || !email.includes("@")) {
      throw new Error("A valid email address is required.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = Array.from(this.users.values()).find((u) => u.email === cleanEmail);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = this._hashPassword(password, salt);
    const userId = "usr_" + crypto.randomBytes(8).toString("hex");
    const finalName = name?.trim() || cleanEmail.split("@")[0];

    const safeRole = ["ADMIN", "FINOPS_LEAD", "USER"].includes(role) ? role : "USER";

    const user = {
      id: userId,
      authProvider: "PASSWORD",
      email: cleanEmail,
      passwordHash: hash,
      passwordSalt: salt,
      phoneNumber: null,
      name: finalName,
      role: safeRole,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=2563eb&color=fff&bold=true`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    this.users.set(user.id, user);
    this._saveUsers();

    const token = this._createSession(user.id);
    this.logAudit("USER_REGISTER", user.id, `New user ${user.email} registered with role ${user.role}.`);

    return {
      success: true,
      message: "Account created successfully.",
      token,
      user: this._sanitizeUser(user)
    };
  }

  updateUserRole(userId, newRole) {
    const validRoles = ["ADMIN", "FINOPS_LEAD", "USER", "Cloud Administrator"];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found.");

    const oldRole = user.role;
    user.role = newRole;
    this._saveUsers();
    this.logAudit("ROLE_CHANGE", userId, `User ${user.email || user.phoneNumber} role updated from ${oldRole} to ${newRole}.`, "WARN");

    return { success: true, user: this._sanitizeUser(user) };
  }

  /**
   * Resolves currently active user session from Bearer token
   */
  getUserByToken(token) {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    const rawUser = this.users.get(session.userId) || null;
    return this._sanitizeUser(rawUser);
  }

  /**
   * Invalidates active session (logout)
   */
  logout(token) {
    if (token && this.sessions.has(token)) {
      const session = this.sessions.get(token);
      this.sessions.delete(token);
      this.logAudit("USER_LOGOUT", session?.userId || "UNKNOWN", "User session terminated.");
      return { success: true, message: "Logged out successfully." };
    }
    return { success: true, message: "Session cleared." };
  }

  /**
   * Updates profile information
   */
  updateProfile(userId, { name, role, email, phoneNumber }) {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found.");

    if (name) user.name = name.trim();
    if (role && ["ADMIN", "FINOPS_LEAD", "USER"].includes(role)) user.role = role.trim();
    if (email && email.includes("@")) user.email = email.toLowerCase().trim();
    if (phoneNumber) user.phoneNumber = this.normalizePhoneNumber(phoneNumber);

    this._saveUsers();
    return { success: true, user: this._sanitizeUser(user) };
  }

  getAllUsers() {
    return Array.from(this.users.values()).map((u) => this._sanitizeUser(u));
  }
}

const authService = new AuthService();
module.exports = authService;
