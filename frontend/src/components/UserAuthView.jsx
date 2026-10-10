import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCloud } from "../context/CloudContext";
import {
  KeyRound,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Server,
  Fingerprint,
  Clock,
  ExternalLink
} from "lucide-react";

export const UserAuthView = () => {
  const {
    user,
    token,
    isAuthenticated,
    authLoading,
    authError,
    setAuthError,
    lastGeneratedOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle,
    logout
  } = useAuth();

  const { account } = useCloud();

  const [activeTab, setActiveTab] = useState("google"); // "google" | "phone"
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Fetch all registered users
  const loadUsers = () => {
    fetch("http://localhost:5000/api/auth/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAllUsers(data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, [user]);

  // Google sign in handler
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setAuthError("Please enter your Gmail address.");
      return;
    }
    const email = googleEmail.trim();
    const name = googleName.trim() || email.split("@")[0];
    await loginWithGoogle({
      email,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ea4335&color=fff&bold=true`
    });
  };

  const handleQuickGoogleSignIn = async (presetEmail, presetName) => {
    await loginWithGoogle({
      email: presetEmail,
      name: presetName,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(presetName)}&background=ea4335&color=fff&bold=true`
    });
  };

  // Phone OTP handlers
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneDigits.trim() || phoneDigits.trim().length < 7) {
      setAuthError("Please enter a valid mobile number.");
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

    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...enteredOtp];
    newDigits[index] = digit;
    setEnteredOtp(newDigits);

    if (digit && index < 5) {
      const nextInput = document.getElementById(`fullview-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !enteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`fullview-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleAutoFillOtp = () => {
    if (lastGeneratedOtp && lastGeneratedOtp.length === 6) {
      setEnteredOtp(lastGeneratedOtp.split(""));
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = enteredOtp.join("");
    if (fullOtp.length !== 6) {
      setAuthError("Please enter the complete 6-digit OTP code.");
      return;
    }

    const fullPhone = `${countryCode}${phoneDigits.trim()}`;
    await verifyPhoneOtp(fullPhone, fullOtp, displayName.trim() || null);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Banner Header */}
      <div
        className="glass-card"
        style={{
          padding: "24px 32px",
          borderRadius: "16px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(16, 185, 129, 0.08))",
          border: "1px solid rgba(2, 132, 199, 0.25)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 6px 16px rgba(2, 132, 199, 0.3)"
              }}
            >
              <KeyRound size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                User Identity & Access Management (IAM)
              </h1>
              <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "4px 0 0 0" }}>
                Sign in with Google (Gmail) or Mobile Phone Number with 6-digit OTP Generator
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="badge badge-neon-green" style={{ fontSize: "0.82rem", padding: "6px 14px" }}>
              Authenticated Session Active
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Sign In Form) & Right Column (Active Credentials & AWS Matrix) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* COLUMN 1: AUTHENTICATION PANEL */}
        <div className="glass-card" style={{ padding: "28px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Fingerprint size={22} style={{ color: "#0284c7" }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              {isAuthenticated ? "Switch / Register Account" : "Sign In / Register"}
            </h2>
          </div>

          {/* Switcher Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              padding: "4px",
              backgroundColor: "#f1f5f9",
              borderRadius: "10px",
              marginBottom: "20px"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("google");
                setAuthError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.88rem",
                backgroundColor: activeTab === "google" ? "#ffffff" : "transparent",
                color: activeTab === "google" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "google" ? "0 2px 4px rgba(0,0,0,0.06)" : "none"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setAuthError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.88rem",
                backgroundColor: activeTab === "phone" ? "#ffffff" : "transparent",
                color: activeTab === "phone" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "phone" ? "0 2px 4px rgba(0,0,0,0.06)" : "none"
              }}
            >
              <Phone size={17} style={{ color: "#10b981" }} />
              <span>Phone No. + OTP</span>
            </button>
          </div>

          {/* Error Banner */}
          {authError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px"
              }}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE (GMAIL) */}
          {activeTab === "google" && (
            <div>
              {/* 1-Click Fast Login */}
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  1-Click Fast Sign-In
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSignIn("aryan.cloud@gmail.com", "Aryan AWS FinOps")}
                  disabled={authLoading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#ea4335",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "0.95rem"
                      }}
                    >
                      A
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#0f172a" }}>Aryan AWS FinOps</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>aryan.cloud@gmail.com</div>
                    </div>
                  </div>
                  <span className="badge badge-neon-green" style={{ fontSize: "0.72rem" }}>Gmail Verified</span>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600" }}>OR ENTER GMAIL ADDRESS</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
              </div>

              <form onSubmit={handleGoogleSubmit}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Your Gmail Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 38px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Your Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="e.g. Aryan Sharma"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 38px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#0284c7"
                  }}
                >
                  {authLoading ? (
                    <>
                      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Gmail</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PHONE NO. + OTP GENERATOR */}
          {activeTab === "phone" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Enter Mobile Phone Number
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.88rem",
                          fontWeight: "600",
                          backgroundColor: "#f8fafc",
                          outline: "none"
                        }}
                      >
                        <option value="+91">🇮🇳 +91 (IN)</option>
                        <option value="+1">🇺🇸 +1 (US)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+65">🇸🇬 +65 (SG)</option>
                        <option value="+971">🇦🇪 +971 (UAE)</option>
                      </select>

                      <div style={{ position: "relative", flex: 1 }}>
                        <Phone size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                        <input
                          type="tel"
                          placeholder="e.g. 98765 43210"
                          value={phoneDigits}
                          onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
                          required
                          maxLength={12}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 38px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.88rem",
                            outline: "none"
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      borderRadius: "8px",
                      backgroundColor: "#10b981"
                    }}
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Generating 6-Digit Code...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Generate & Send 6-Digit OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  {/* Real-Time OTP Generator Banner */}
                  {lastGeneratedOtp && (
                    <div
                      style={{
                        padding: "14px 18px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                        border: "1px solid #a7f3d0",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#065f46", textTransform: "uppercase" }}>
                          📲 OTP Generator Live Code
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#047857", letterSpacing: "3px", fontFamily: "monospace", margin: "2px 0" }}>
                          {lastGeneratedOtp}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#065f46" }}>Sent to {countryCode} {phoneDigits} (Valid for 5 mins)</div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoFillOtp}
                        style={{
                          padding: "8px 14px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          borderRadius: "8px",
                          border: "none",
                          background: "#059669",
                          color: "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)"
                        }}
                      >
                        <Sparkles size={14} />
                        <span>Auto-Fill OTP</span>
                      </button>
                    </div>
                  )}

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Change Number
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      {enteredOtp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`fullview-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          style={{
                            width: "48px",
                            height: "52px",
                            textAlign: "center",
                            fontSize: "1.4rem",
                            fontWeight: "800",
                            fontFamily: "monospace",
                            borderRadius: "8px",
                            border: digit ? "2px solid #10b981" : "1px solid #cbd5e1",
                            background: digit ? "#f0fdf4" : "#ffffff",
                            outline: "none"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aryan AWS Ops"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || enteredOtp.join("").length !== 6}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      borderRadius: "8px",
                      backgroundColor: "#10b981"
                    }}
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <div style={{ marginTop: "14px", textAlign: "center" }}>
                    {countdown > 0 ? (
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Resend code in <strong>{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        style={{ background: "none", border: "none", color: "#059669", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Resend 6-Digit OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 2: ACTIVE CREDENTIALS & AWS MATRIX */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card A: Active User Session Credentials */}
          <div className="glass-card" style={{ padding: "28px", borderRadius: "16px", border: isAuthenticated ? "1px solid #a7f3d0" : "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldCheck size={22} style={{ color: isAuthenticated ? "#059669" : "#64748b" }} />
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  Active User Session Credentials
                </h3>
              </div>

            </div>

            {isAuthenticated && user ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px", background: "#f8fafc", borderRadius: "10px", marginBottom: "16px" }}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>{user.name}</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{user.email || user.phoneNumber}</div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <span className="badge badge-neon-green" style={{ fontSize: "0.68rem" }}>
                        {user.authProvider === "GOOGLE" ? "Google (Gmail)" : "Phone OTP"}
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: "0.68rem" }}>{user.role}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem" }}>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", textTransform: "uppercase" }}>User ID</span>
                    <span style={{ fontWeight: "700", fontFamily: "monospace", color: "#0f172a" }}>{user.id}</span>
                  </div>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", textTransform: "uppercase" }}>Session State</span>
                    <span style={{ fontWeight: "700", color: "#059669" }}>Active & Valid</span>
                  </div>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", gridColumn: "span 2" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", textTransform: "uppercase" }}>Session Bearer Token</span>
                    <span style={{ fontWeight: "600", fontFamily: "monospace", color: "#475569", fontSize: "0.75rem", wordBreak: "break-all" }}>
                      {token ? `${token.substring(0, 24)}...${token.substring(token.length - 8)}` : "None"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b" }}>
                <Lock size={36} style={{ color: "#94a3b8", margin: "0 auto 10px auto", display: "block" }} />
                <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                  No Active User Signed In
                </div>
                <p style={{ fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto 16px auto" }}>
                  Please select an identity or enter your credentials on the left.
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSignIn("aryan.cloud@gmail.com", "Aryan AWS FinOps")}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: "#0284c7" }}
                >
                  Quick Sign In as Aryan
                </button>
              </div>
            )}
          </div>

          {/* Card B: AWS Cloud Account Connection */}
          <div className="glass-card" style={{ padding: "24px 28px", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Server size={20} style={{ color: "#ea580c" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Target AWS Infrastructure Account
              </h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: "1.5", margin: "0 0 12px 0" }}>
              Your user identity is authenticated for portal operations. Telemetry & optimizations are executed on the following AWS target account:
            </p>

            <div style={{ padding: "12px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#9a3412" }}>
                  AWS Cloud Connection: Active
                </div>
                <div style={{ fontSize: "0.75rem", color: "#c2410c" }}>
                  Region: {account?.primaryRegion || "ap-south-1"} (Mumbai) • IAM Key Active
                </div>
              </div>
              <span className="badge badge-neon-green" style={{ fontSize: "0.7rem" }}>Live API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Directory of Registered Users */}
      <div className="glass-card" style={{ marginTop: "24px", padding: "28px", borderRadius: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={20} style={{ color: "#0284c7" }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Registered FinOps Users Directory ({allUsers.length})
            </h3>
          </div>
          <button onClick={loadUsers} className="btn btn-secondary btn-xs" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {allUsers.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
            No registered users yet. Sign in above to create the first user account.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table" style={{ width: "100%", fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact Identifier</th>
                  <th>Method</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => {
                  const isCurrent = user?.id === u.id;
                  return (
                    <tr key={u.id} style={{ background: isCurrent ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={u.avatar} alt={u.name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                          <span style={{ fontWeight: isCurrent ? "700" : "600", color: "#0f172a" }}>
                            {u.name} {isCurrent && <span style={{ color: "#059669", fontSize: "0.75rem" }}>(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", color: "#475569" }}>
                          {u.email || u.phoneNumber || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.authProvider === "GOOGLE" ? "badge-cyan" : "badge-neon-green"}`} style={{ fontSize: "0.72rem" }}>
                          {u.authProvider === "GOOGLE" ? "Gmail" : "Phone OTP"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>{u.role}</span>
                      </td>
                      <td>
                        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neon-green" style={{ fontSize: "0.72rem" }}>Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
