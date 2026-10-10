import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Server,
  KeyRound,
  Phone,
  HelpCircle,
  X
} from "lucide-react";

export const LoginPage = () => {
  const {
    authLoading,
    authError,
    setAuthError,
    lastGeneratedOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle,
    loginWithPassword
  } = useAuth();

  const { resolvedTheme } = useTheme();

  // Active tab: "password" | "google" | "phone"
  const [activeTab, setActiveTab] = useState("password");

  // Email & Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Google Sign-In state
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  // Phone + OTP state
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [countdown, setCountdown] = useState(0);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthError("Please provide both email address and password.");
      return;
    }
    setIsAuthenticating(true);
    const res = await loginWithPassword({
      email: email.trim(),
      password,
      rememberMe
    });
    setIsAuthenticating(false);
  };

  // Preset autofill helpers for testing
  const fillCredentials = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setActiveTab("password");
    setAuthError("");
  };

  // Handle Google Sign In
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setAuthError("Please enter your Gmail or Google Workspace email address.");
      return;
    }
    const mail = googleEmail.trim();
    const name = googleName.trim() || mail.split("@")[0];
    await loginWithGoogle({
      email: mail,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&bold=true`
    });
  };

  const handleQuickGoogleSignIn = async (presetEmail, presetName) => {
    await loginWithGoogle({
      email: presetEmail,
      name: presetName,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(presetName)}&background=0284c7&color=fff&bold=true`
    });
  };

  // Handle Phone OTP Send
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneDigits.trim() || phoneDigits.trim().length < 7) {
      setAuthError("Please enter a valid mobile phone number.");
      return;
    }
    const fullPhone = `${countryCode}${phoneDigits.trim()}`;
    const res = await sendPhoneOtp(fullPhone);
    if (res.success) {
      setOtpSent(true);
      setCountdown(45);
      setEnteredOtp(["", "", "", "", "", ""]);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...enteredOtp];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setEnteredOtp(newDigits);
        return;
      }
    }
    const clean = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...enteredOtp];
    newDigits[index] = clean;
    setEnteredOtp(newDigits);

    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !enteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = enteredOtp.join("");
    if (code.length < 6) {
      setAuthError("Please enter all 6 digits of the OTP code.");
      return;
    }
    const fullPhone = `${countryCode}${phoneDigits.trim()}`;
    await verifyPhoneOtp(fullPhone, code, displayName.trim());
  };

  // Forgot password submit
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        padding: "24px 16px"
      }}
    >
      {/* Centered Master Layout Wrapper */}
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          background: "var(--bg-card)",
          borderRadius: "24px",
          border: "1px solid var(--border-card)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          minHeight: "640px"
        }}
        className="login-card-wrapper"
      >
        {/* LEFT SIDE: FinOps Value Proposition & Cloud Analytics Preview */}
        <div
          style={{
            padding: "48px 40px",
            background: resolvedTheme === "dark" 
              ? "linear-gradient(145deg, #0b1120 0%, #0f172a 100%)" 
              : "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
          className="login-left-pane"
        >
          {/* Brand header */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "rgba(255, 153, 0, 0.15)",
                  border: "1px solid rgba(255, 153, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--aws-orange)"
                }}
              >
                <Cloud size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                  CloudOptix AI
                </h1>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.04em" }}>
                  Cloud Cost Optimization & FinOps Platform
                </span>
              </div>
            </div>

            {/* Core Value Headline */}
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "800",
                  lineHeight: "1.25",
                  color: "var(--text-heading)",
                  marginBottom: "12px",
                  letterSpacing: "-0.02em"
                }}
              >
                Optimize Cloud Costs. <br />
                <span style={{ color: "var(--aws-orange)" }}>Automatically.</span>
              </h2>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                  lineHeight: "1.6",
                  margin: 0,
                  maxWidth: "460px"
                }}
              >
                CloudOptix AI helps engineering and finance teams understand, control, and optimize their AWS cloud infrastructure spending with continuous machine learning.
              </p>
            </div>

            {/* FinOps Live Telemetry Preview Card */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid var(--border-card)",
                background: resolvedTheme === "dark" ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "24px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.76rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                  Telemetry & Cost Analytics
                </span>
                <span className="badge badge-neon-green" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                  Live AWS Feed
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>Monthly Tracked Spend</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-heading)" }}>$14,280.40</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>Identified Savings</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                    <TrendingDown size={18} />
                    <span>$3,840.12</span>
                  </div>
                </div>
              </div>

              {/* Service micro-bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  <span>EC2 Compute Fleets</span>
                  <span style={{ fontWeight: "600" }}>$7,140 (50%)</span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "var(--bg-subtle)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "50%", background: "var(--aws-orange)", borderRadius: "3px" }}></div>
                </div>
              </div>

              {/* AI Recommendation notification snippet */}
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.76rem",
                  color: "#10b981"
                }}
              >
                <Sparkles size={14} />
                <span>AI Recommendation: Convert 12 idle gp2 EBS volumes to gp3 (Save $420/mo)</span>
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "0.76rem",
              color: "var(--text-muted)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} style={{ color: "#10b981" }} />
              <span>SOC-2 Type II</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={16} style={{ color: "#0ea5e9" }} />
              <span>Read-Only IAM</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={16} style={{ color: "var(--aws-orange)" }} />
              <span>AWS Well-Architected</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Professional Login Card */}
        <div
          style={{
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "var(--bg-card)"
          }}
          className="login-right-pane"
        >
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 6px" }}>
              Welcome back
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Sign in with your corporate credentials or single sign-on.
            </p>
          </div>

          {/* Authentication Method Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "6px",
              background: "var(--bg-subtle)",
              padding: "4px",
              borderRadius: "10px",
              marginBottom: "24px",
              border: "1px solid var(--border-subtle)"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("password");
                setAuthError("");
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                background: activeTab === "password" ? "var(--bg-card)" : "transparent",
                color: activeTab === "password" ? "var(--aws-orange)" : "var(--text-muted)",
                boxShadow: activeTab === "password" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("google");
                setAuthError("");
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                background: activeTab === "google" ? "var(--bg-card)" : "transparent",
                color: activeTab === "google" ? "var(--aws-orange)" : "var(--text-muted)",
                boxShadow: activeTab === "google" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              Google SSO
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setAuthError("");
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                background: activeTab === "phone" ? "var(--bg-card)" : "transparent",
                color: activeTab === "phone" ? "var(--aws-orange)" : "var(--text-muted)",
                boxShadow: activeTab === "phone" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              Mobile OTP
            </button>
          </div>

          {/* Clear Error Notification Banner */}
          {authError && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#ef4444",
                fontSize: "0.82rem",
                marginBottom: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                animation: "modalFadeIn 0.2s ease-out"
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1, lineHeight: "1.4" }}>{authError}</div>
              <button
                type="button"
                onClick={() => setAuthError("")}
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB 1: EMAIL & PASSWORD LOGIN */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "6px" }}>
                  Work Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 38px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "0.88rem",
                      outline: "none",
                      transition: "border-color 0.15s ease"
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)" }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      fontSize: "0.76rem",
                      color: "var(--aws-orange)",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 38px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "0.88rem",
                      outline: "none",
                      transition: "border-color 0.15s ease"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--aws-orange)", cursor: "pointer" }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading || isAuthenticating}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "6px"
                }}
              >
                {authLoading || isAuthenticating ? (
                  <>
                    <RefreshCw size={16} style={{ animation: "spin 1.2s linear infinite" }} />
                    <span>Authenticating Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to CloudOptix</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Quick test account fill helper */}
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "var(--bg-subtle)",
                  border: "1px dashed var(--border-subtle)",
                  fontSize: "0.76rem"
                }}
              >
                <div style={{ color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600" }}>
                  Quick Test Credentials:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => fillCredentials("admin@cloudoptix.ai", "Admin@12345")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Super Admin: admin@cloudoptix.ai
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials("aryan.cloud@gmail.com", "Password@123")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    FinOps Lead: aryan.cloud@gmail.com
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: GOOGLE WORKSPACE SSO */}
          {activeTab === "google" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSignIn("aryan.cloud@gmail.com", "Aryan AWS FinOps")}
                  disabled={authLoading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-card)",
                    background: resolvedTheme === "dark" ? "#1e293b" : "#ffffff",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                    marginBottom: "12px"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>1-Click Continue as Aryan AWS FinOps</span>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }}></div>
                <span>OR SIGN IN WITH CUSTOM GOOGLE ACCOUNT</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }}></div>
              </div>

              <form onSubmit={handleGoogleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "6px" }}>
                    Google / Gmail Email
                  </label>
                  <input
                    type="email"
                    placeholder="user@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "6px" }}>
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "11px", marginTop: "4px" }}
                >
                  {authLoading ? "Authenticating..." : "Authorize via Google"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MOBILE PHONE OTP */}
          {activeTab === "phone" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "6px" }}>
                      Mobile Phone Number
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        style={{
                          width: "84px",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-subtle)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem"
                        }}
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+65">+65 (SG)</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
                        required
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-subtle)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem"
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "11px" }}
                  >
                    {authLoading ? "Dispatching SMS..." : "Send Verification OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ textAlign: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Verification code sent to {countryCode} {phoneDigits}
                    </span>
                    {lastGeneratedOtp && (
                      <div style={{ marginTop: "6px", fontSize: "0.78rem", color: "#10b981", fontWeight: "700" }}>
                        Development OTP Simulator: {lastGeneratedOtp}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    {enteredOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        style={{
                          width: "44px",
                          height: "50px",
                          textAlign: "center",
                          fontSize: "1.25rem",
                          fontWeight: "800",
                          borderRadius: "8px",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-subtle)",
                          color: "var(--text-primary)"
                        }}
                      />
                    ))}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "6px" }}>
                      Your Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="Aryan AWS FinOps"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-subtle)",
                        color: "var(--text-primary)",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "11px" }}
                  >
                    {authLoading ? "Verifying Token..." : "Verify & Launch Console"}
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      Change Phone Number
                    </button>
                    {countdown > 0 ? (
                      <span style={{ color: "var(--text-muted)" }}>Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        style={{ background: "transparent", border: "none", color: "var(--aws-orange)", cursor: "pointer", fontWeight: "600" }}
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "420px",
              width: "100%",
              padding: "28px",
              borderRadius: "16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              animation: "modalFadeIn 0.2s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0 }}>Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {!forgotSent ? (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "16px" }}>
                  Enter your verified work email address and our IAM service will send you a secure password reset link.
                </p>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    marginBottom: "16px"
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                  Send Recovery Link
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <CheckCircle2 size={36} style={{ color: "#10b981", margin: "0 auto 12px" }} />
                <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "8px" }}>Reset Link Dispatched</h4>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  If an account exists for {forgotEmail}, instructions have been sent.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="btn btn-secondary"
                  style={{ width: "100%", padding: "9px" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Styles Injection */}
      <style>{`
        @media (max-width: 900px) {
          .login-card-wrapper {
            grid-template-columns: 1fr !important;
            max-width: 520px !important;
          }
          .login-left-pane {
            display: none !important;
          }
          .login-right-pane {
            padding: 32px 24px !important;
          }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
