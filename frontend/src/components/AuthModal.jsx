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
    lastGeneratedEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    sendEmailOtp,
    verifyEmailOtp,
    loginWithGoogle
  } = useAuth();

  const [activeTab, setActiveTab] = useState("emailOtp"); // "emailOtp" | "google" | "phone"

  // Email OTP State
  const [emailOtpAddress, setEmailOtpAddress] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [enteredEmailOtp, setEnteredEmailOtp] = useState(["", "", "", "", "", ""]);
  const [emailDisplayName, setEmailDisplayName] = useState("");
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Google State
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  // Email OTP Handlers
  const handleSendEmailOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!emailOtpAddress.trim()) {
      setAuthError("Please enter your work or personal email address.");
      return;
    }
    const res = await sendEmailOtp(emailOtpAddress.trim());
    if (res.success) {
      setEmailOtpSent(true);
      setEmailCountdown(45);
      setEnteredEmailOtp(["", "", "", "", "", ""]);
    }
  };

  const handlePresetEmailOtp = async (presetEmail) => {
    setEmailOtpAddress(presetEmail);
    setAuthError("");
    const res = await sendEmailOtp(presetEmail);
    if (res.success) {
      setEmailOtpSent(true);
      setEmailCountdown(45);
      setEnteredEmailOtp(["", "", "", "", "", ""]);
    }
  };

  const handleAutoConnectEmailOtp = async () => {
    if (lastGeneratedEmailOtp && lastGeneratedEmailOtp.length === 6) {
      setEnteredEmailOtp(lastGeneratedEmailOtp.split(""));
      await verifyEmailOtp(emailOtpAddress.trim(), lastGeneratedEmailOtp, emailDisplayName.trim() || null);
    }
  };

  const handleEmailOtpChange = async (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...enteredEmailOtp];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setEnteredEmailOtp(newDigits);
        if (pasted.length === 6) {
          await verifyEmailOtp(emailOtpAddress.trim(), pasted, emailDisplayName.trim() || null);
        }
        return;
      }
    }

    const clean = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...enteredEmailOtp];
    newDigits[index] = clean;
    setEnteredEmailOtp(newDigits);

    if (clean && index < 5) {
      const nextInput = document.getElementById(`modal-email-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (clean && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        await verifyEmailOtp(emailOtpAddress.trim(), fullCode, emailDisplayName.trim() || null);
      }
    }
  };

  const handleEmailOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !enteredEmailOtp[index] && index > 0) {
      const prevInput = document.getElementById(`modal-email-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const fullOtp = enteredEmailOtp.join("");
    if (fullOtp.length !== 6) {
      setAuthError("Please enter the complete 6-digit email verification code.");
      return;
    }
    await verifyEmailOtp(emailOtpAddress.trim(), fullOtp, emailDisplayName.trim() || null);
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
            gridTemplateColumns: "1.15fr 1fr",
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
              setActiveTab("emailOtp");
              setAuthError("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 8px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "emailOtp" ? "#ffffff" : "transparent",
              color: activeTab === "emailOtp" ? "#0284c7" : "#64748b",
              boxShadow: activeTab === "emailOtp" ? "0 2px 4px rgba(0, 0, 0, 0.06)" : "none"
            }}
          >
            <Zap size={15} style={{ color: "#0284c7" }} />
            <span>Mail OTP (Auto)</span>
          </button>

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
              gap: "6px",
              padding: "10px 8px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "google" ? "#ffffff" : "transparent",
              color: activeTab === "google" ? "#0f172a" : "#64748b",
              boxShadow: activeTab === "google" ? "0 2px 4px rgba(0, 0, 0, 0.06)" : "none"
            }}
          >
            {/* Google Colorful G SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24">
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
            <span>Google</span>
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

        {/* TAB 0: EMAIL VERIFICATION CODE OTP + AUTO-CONNECT */}
        {activeTab === "emailOtp" && (
          <div>
            {!emailOtpSent ? (
              <form onSubmit={handleSendEmailOtp}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155" }}>
                      Work or Personal Email
                    </label>
                    <span className="badge badge-neon-green" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                      ⚡ Auto-Connect
                    </span>
                  </div>

                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="email"
                      placeholder="e.g. aryan.cloud@gmail.com"
                      value={emailOtpAddress}
                      onChange={(e) => setEmailOtpAddress(e.target.value)}
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

                {/* Quick Auto-Connect Presets */}
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>
                    Quick Auto-Connect Profiles:
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { label: "Aryan Cloud (Admin)", email: "aryan.cloud@gmail.com" },
                      { label: "CloudOptix Admin", email: "admin@cloudoptix.ai" },
                      { label: "FinOps Lead", email: "finops.engineer@cloudoptix.ai" }
                    ].map((preset) => (
                      <button
                        key={preset.email}
                        type="button"
                        onClick={() => handlePresetEmailOtp(preset.email)}
                        disabled={authLoading}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#334155",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Sparkles size={11} style={{ color: "#0284c7" }} />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Connect Callout */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "rgba(2, 132, 199, 0.08)",
                    border: "1px solid rgba(2, 132, 199, 0.25)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "0.78rem",
                    color: "#0369a1",
                    marginBottom: "16px"
                  }}
                >
                  <Zap size={15} style={{ color: "#0284c7", flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ lineHeight: "1.4" }}>
                    <strong>Auto-Connect Live AWS:</strong> Session connects directly with live AWS Cloud telemetry upon code verification.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "11px",
                    fontWeight: "700",
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
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      <span>Generate & Send Mail OTP</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp}>
                {/* Real-time Code Banner with Auto-Connect */}
                {lastGeneratedEmailOtp && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #e0f2fe, #dcfce7)",
                      border: "1px solid #38bdf8",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#0369a1", textTransform: "uppercase" }}>
                        📧 Live Mail Verification Code
                      </div>
                      <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0284c7", letterSpacing: "3px", fontFamily: "monospace", margin: "2px 0" }}>
                        {lastGeneratedEmailOtp}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#075985" }}>Sent to {emailOtpAddress}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoConnectEmailOtp}
                      disabled={authLoading}
                      style={{
                        padding: "8px 14px",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #0284c7, #059669)",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Zap size={14} />
                      <span>Auto Connect</span>
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Enter 6-Digit Email Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setEmailOtpSent(false)}
                      style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                    >
                      Change Email
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    {enteredEmailOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`modal-email-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleEmailOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleEmailOtpKeyDown(idx, e)}
                        style={{
                          width: "44px",
                          height: "48px",
                          textAlign: "center",
                          fontSize: "1.3rem",
                          fontWeight: "800",
                          fontFamily: "monospace",
                          borderRadius: "8px",
                          border: digit ? "2px solid #0284c7" : "1px solid #cbd5e1",
                          background: digit ? "#f0f9ff" : "#ffffff",
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
                    placeholder="e.g. Aryan Sharma"
                    value={emailDisplayName}
                    onChange={(e) => setEmailDisplayName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || enteredEmailOtp.join("").length !== 6}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "11px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#0284c7",
                    opacity: enteredEmailOtp.join("").length === 6 ? 1 : 0.6
                  }}
                >
                  {authLoading ? (
                    <>
                      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                      <span>Verifying & Auto-Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Verify & Auto-Connect</span>
                    </>
                  )}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "0.8rem" }}>
                  <button
                    type="button"
                    onClick={() => setEmailOtpSent(false)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  {emailCountdown > 0 ? (
                    <span style={{ color: "#94a3b8" }}>Resend in {emailCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", fontWeight: "600" }}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}
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
