import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Lock,
  User,
  Zap,
  KeyRound
} from "lucide-react";

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authLoading,
    authError,
    setAuthError,
    lastGeneratedOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle
  } = useAuth();

  const [activeTab, setActiveTab] = useState("google"); // "google" | "phone"

  // Google State
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  // Phone & OTP State
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(["", "", "", "", "", ""]);
  const [userName, setUserName] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isAuthModalOpen) return null;

  // Handle Google Sign In
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

  // Quick 1-click Google Sign-In with preset
  const handleQuickGoogleSignIn = async (presetEmail, presetName) => {
    await loginWithGoogle({
      email: presetEmail,
      name: presetName,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(presetName)}&background=ea4335&color=fff&bold=true`
    });
  };

  // Handle Send OTP
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

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Pasted full OTP
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

    // Auto-focus next input
    if (digit && index < 5) {
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

  // Auto-fill generated OTP for 1-click testing
  const handleAutoFillOtp = () => {
    if (lastGeneratedOtp && lastGeneratedOtp.length === 6) {
      const chars = lastGeneratedOtp.split("");
      setEnteredOtp(chars);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = enteredOtp.join("");
    if (fullOtp.length !== 6) {
      setAuthError("Please enter the complete 6-digit OTP code.");
      return;
    }

    const fullPhone = `${countryCode}${phoneDigits.trim()}`;
    await verifyPhoneOtp(fullPhone, fullOtp, userName.trim() || null);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
      <div
        className="modal-card white-box-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "520px",
          width: "92%",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
          border: "1px solid var(--border-light)"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
              }}
            >
              <KeyRound size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                Sign In to CloudOptix
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                Access live AWS FinOps controls & optimization recommendations
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Method Switcher Tabs */}
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
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.88rem",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "google" ? "#ffffff" : "transparent",
              color: activeTab === "google" ? "#0f172a" : "#64748b",
              boxShadow: activeTab === "google" ? "0 2px 4px rgba(0, 0, 0, 0.06)" : "none"
            }}
          >
            {/* Google Colorful G SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google (Gmail)</span>
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
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.88rem",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "phone" ? "#ffffff" : "transparent",
              color: activeTab === "phone" ? "#0f172a" : "#64748b",
              boxShadow: activeTab === "phone" ? "0 2px 4px rgba(0, 0, 0, 0.06)" : "none"
            }}
          >
            <Phone size={17} style={{ color: "#10b981" }} />
            <span>Phone No. + OTP</span>
          </button>
        </div>

        {/* Error Alert */}
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

        {/* TAB 1: GOOGLE (GMAIL) SIGN-IN */}
        {activeTab === "google" && (
          <div>
            {/* Quick 1-Click Google Account Selector */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "8px" }}>
                1-CLICK GOOGLE ACCOUNT SIGN-IN
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSignIn("aryan.cloud@gmail.com", "Aryan AWS FinOps")}
                  disabled={authLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#ea4335",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "0.85rem"
                      }}
                    >
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>Aryan AWS FinOps</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>aryan.cloud@gmail.com</div>
                    </div>
                  </div>
                  <span className="badge badge-neon-green" style={{ fontSize: "0.7rem" }}>Gmail Verified</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600" }}>OR ENTER GMAIL ADDRESS</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
            </div>

            <form onSubmit={handleGoogleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Your Google (Gmail) Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type="email"
                    placeholder="e.g. devops.lead@gmail.com"
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
                  Your Full Name (Optional)
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
                    <span>Signing in with Google...</span>
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

        {/* TAB 2: PHONE NO. WITH OTP GENERATOR */}
        {activeTab === "phone" && (
          <div>
            {!otpSent ? (
              // Step 1: Enter Phone Number
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Mobile Phone Number
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
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                    A 6-digit cryptographic one-time password (OTP) will be dispatched.
                  </span>
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
                      <span>Generating 6-Digit OTP...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Send 6-Digit Verification Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Step 2: Enter & Verify 6-Digit OTP
              <form onSubmit={handleVerifyOtp}>
                {/* On-screen OTP notification banner for easy testing */}
                {lastGeneratedOtp && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                      border: "1px solid #a7f3d0",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#065f46", textTransform: "uppercase" }}>
                        📲 OTP Generator Dispatch
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#047857", letterSpacing: "2px", fontFamily: "monospace" }}>
                        {lastGeneratedOtp}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#065f46" }}>Valid for 5 mins to {countryCode} {phoneDigits}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        borderRadius: "6px",
                        border: "none",
                        background: "#059669",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Auto-fill OTP</span>
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
                      Change Number ({countryCode} {phoneDigits})
                    </button>
                  </div>

                  {/* 6 Segmented Input Boxes */}
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
                          width: "46px",
                          height: "50px",
                          textAlign: "center",
                          fontSize: "1.3rem",
                          fontWeight: "700",
                          fontFamily: "monospace",
                          borderRadius: "8px",
                          border: digit ? "2px solid #10b981" : "1px solid #cbd5e1",
                          background: digit ? "#f0fdf4" : "#ffffff",
                          outline: "none",
                          transition: "all 0.15s ease"
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
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
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
                      <span>Verifying OTP Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Verify & Access Platform</span>
                    </>
                  )}
                </button>

                <div style={{ marginTop: "14px", textAlign: "center" }}>
                  {countdown > 0 ? (
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Resend code available in <strong>{countdown}s</strong>
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

        {/* Security Trust Badges */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            fontSize: "0.72rem",
            color: "#64748b"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Lock size={12} style={{ color: "#10b981" }} /> 256-bit TLS Encrypted
          </span>
          <span>•</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ShieldCheck size={12} style={{ color: "#0284c7" }} /> AWS IAM Scoped Session
          </span>
        </div>
      </div>
    </div>
  );
};
