import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  X,
  Sun,
  Moon
} from "lucide-react";

export const LoginPage = () => {
  const {
    authLoading,
    authError,
    setAuthError,
    lastGeneratedEmailOtp,
    sendEmailOtp,
    verifyEmailOtp,
    loginWithGoogle
  } = useAuth();

  const { resolvedTheme, toggleTheme } = useTheme();

  // Email state
  const [emailAddress, setEmailAddress] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);

  // Google SSO & Permission Dialog State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState("aryan.cloud@gmail.com");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [googleAuthStep, setGoogleAuthStep] = useState("select"); // "select" | "sending"

  // Other SSO simulated state
  const [ssoMessage, setSsoMessage] = useState("");

  const digitRefs = useRef([]);

  // Resend Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first digit box when OTP screen appears
  useEffect(() => {
    if (otpSent && digitRefs.current[0]) {
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    }
  }, [otpSent]);

  // Handle Send Email OTP (Continue Button)
  const handleContinueWithEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const mail = emailAddress.trim();
    if (!mail) {
      setAuthError("Please enter your email address to continue.");
      return;
    }
    setAuthError("");
    const res = await sendEmailOtp(mail);
    if (res.success) {
      setOtpSent(true);
      setCountdown(45);
      setEnteredOtp(["", "", "", "", "", ""]);
    }
  };

  // Quick preset email click
  const handleQuickPreset = async (presetEmail) => {
    setEmailAddress(presetEmail);
    setAuthError("");
    const res = await sendEmailOtp(presetEmail);
    if (res.success) {
      setOtpSent(true);
      setCountdown(45);
      setEnteredOtp(["", "", "", "", "", ""]);
    }
  };

  // 1-Click Auto-Connect with Email OTP code!
  const handleAutoConnect = async () => {
    if (lastGeneratedEmailOtp && lastGeneratedEmailOtp.length === 6) {
      const digits = lastGeneratedEmailOtp.split("");
      setEnteredOtp(digits);
      await verifyEmailOtp(emailAddress.trim(), lastGeneratedEmailOtp);
    }
  };

  // Handle individual OTP digit input
  const handleDigitChange = async (index, value) => {
    // Handle paste of 6 digits
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, "").slice(0, 6);
      if (cleanPasted.length > 0) {
        const newDigits = [...enteredOtp];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleanPasted[i] || "";
        }
        setEnteredOtp(newDigits);
        if (cleanPasted.length === 6) {
          await verifyEmailOtp(emailAddress.trim(), cleanPasted);
        }
        return;
      }
    }

    const clean = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...enteredOtp];
    newDigits[index] = clean;
    setEnteredOtp(newDigits);

    // Auto advance to next box
    if (clean && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }

    // Auto verify upon 6th digit
    if (clean && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        await verifyEmailOtp(emailAddress.trim(), fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !enteredOtp[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = enteredOtp.join("");
    if (code.length < 6) {
      setAuthError("Please enter all 6 digits of the verification code.");
      return;
    }
    await verifyEmailOtp(emailAddress.trim(), code);
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setAuthError("");
    const res = await sendEmailOtp(emailAddress.trim());
    if (res.success) {
      setCountdown(45);
      setEnteredOtp(["", "", "", "", "", ""]);
    }
  };

  // Google SSO: Send permission OTP to Google email
  const handleGooglePermissionOtp = async () => {
    const targetEmail = selectedGoogleAccount === "custom"
      ? customGoogleEmail.trim()
      : selectedGoogleAccount;

    if (!targetEmail) {
      setAuthError("Please provide a valid Google email address.");
      return;
    }

    setShowGoogleModal(false);
    setEmailAddress(targetEmail);
    setAuthError("");

    const res = await sendEmailOtp(targetEmail);
    if (res.success) {
      setOtpSent(true);
      setCountdown(45);
      setEnteredOtp(["", "", "", "", "", ""]);
    }
  };

  // Google SSO: Direct 1-Click Connect
  const handleGoogleDirectConnect = async () => {
    const targetEmail = selectedGoogleAccount === "custom"
      ? customGoogleEmail.trim()
      : selectedGoogleAccount;

    if (!targetEmail) {
      setAuthError("Please provide a valid Google email address.");
      return;
    }

    setShowGoogleModal(false);
    const name = targetEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    await loginWithGoogle({
      email: targetEmail,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&bold=true`
    });
  };

  const isDark = resolvedTheme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#0c0d0e" : "#ffffff",
        color: isDark ? "#ffffff" : "#111827",
        padding: "32px 16px",
        position: "relative",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Top right Theme toggle */}
      <div style={{ position: "absolute", top: "20px", right: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            background: isDark ? "#1a1b1e" : "#f3f4f6",
            border: `1px solid ${isDark ? "#2c2d30" : "#e5e7eb"}`,
            color: isDark ? "#e5e7eb" : "#374151",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease"
          }}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* Main Notion-Style Centered Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "modalFadeIn 0.25s ease-out"
        }}
      >
        {/* App Logo (Icon in square matching Notion style) */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: isDark ? "#18191c" : "#ffffff",
            border: `1.5px solid ${isDark ? "#2f3136" : "#e5e7eb"}`,
            boxShadow: isDark
              ? "0 4px 16px rgba(0, 0, 0, 0.4)"
              : "0 4px 16px rgba(0, 0, 0, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isDark ? "#ffffff" : "#111827",
            marginBottom: "24px"
          }}
        >
          <div style={{ position: "relative" }}>
            <Cloud size={28} strokeWidth={2.2} style={{ color: "#0a85ea" }} />
            <Zap
              size={14}
              style={{
                position: "absolute",
                bottom: "-3px",
                right: "-5px",
                color: "#ff9900",
                fill: "#ff9900"
              }}
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "800",
            letterSpacing: "-0.025em",
            margin: "0 0 6px 0",
            textAlign: "center",
            color: isDark ? "#ffffff" : "#111827"
          }}
        >
          Your AI workspace.
        </h1>
        <p
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: isDark ? "#888c94" : "#6b7280",
            margin: "0 0 32px 0",
            textAlign: "center"
          }}
        >
          {otpSent ? "Enter verification code" : "Log in to your CloudOptix account"}
        </p>

        {/* Global Error Banner */}
        {authError && (
          <div
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              fontSize: "0.85rem",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1, lineHeight: "1.4" }}>{authError}</div>
            <button
              type="button"
              onClick={() => setAuthError("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                padding: 0
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* SSO Feedback Notice */}
        {ssoMessage && (
          <div
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(10, 133, 234, 0.1)",
              border: "1px solid rgba(10, 133, 234, 0.25)",
              color: "#0a85ea",
              fontSize: "0.85rem",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <RefreshCw size={14} className="animate-spin" />
            <span>{ssoMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: EMAIL ADDRESS INPUT & NOTION-STYLE SSO PROVIDERS */}
        {/* ======================================================== */}
        {!otpSent ? (
          <div style={{ width: "100%" }}>
            <form onSubmit={handleContinueWithEmail} style={{ width: "100%", marginBottom: "24px" }}>
              {/* Email Label */}
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: isDark ? "#c2c5cc" : "#374151",
                  marginBottom: "8px"
                }}
              >
                Email
              </label>

              {/* Email Input Box */}
              <input
                type="email"
                placeholder="Enter your email address..."
                value={emailAddress}
                onChange={(e) => {
                  setEmailAddress(e.target.value);
                  if (authError) setAuthError("");
                }}
                required
                autoFocus
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  border: `1.5px solid ${isDark ? "#2c2d30" : "#d1d5db"}`,
                  background: isDark ? "#141518" : "#ffffff",
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0a85ea";
                  e.target.style.boxShadow = "0 0 0 3px rgba(10, 133, 234, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? "#2c2d30" : "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* Helper text under email input */}
              <p
                style={{
                  fontSize: "0.78rem",
                  color: isDark ? "#7b7f87" : "#6b7280",
                  margin: "6px 0 16px 0",
                  lineHeight: "1.4"
                }}
              >
                Use an organization email to easily collaborate with teammates
              </p>

              {/* Quick Auto-Fill Chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                {[
                  { label: "aryan.cloud@gmail.com", tip: "Admin" },
                  { label: "admin@cloudoptix.ai", tip: "SysAdmin" }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEmailAddress(preset.label)}
                    style={{
                      background: isDark ? "#1a1b1e" : "#f3f4f6",
                      border: `1px solid ${isDark ? "#2c2d30" : "#e5e7eb"}`,
                      color: isDark ? "#9ca3af" : "#4b5563",
                      fontSize: "0.74rem",
                      fontWeight: "500",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    {preset.label} <span style={{ opacity: 0.6 }}>({preset.tip})</span>
                  </button>
                ))}
              </div>

              {/* Continue Button (Blue, matching Notion) */}
              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#0a85ea",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: authLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                onMouseOver={(e) => {
                  if (!authLoading) e.currentTarget.style.background = "#0077d4";
                }}
                onMouseOut={(e) => {
                  if (!authLoading) e.currentTarget.style.background = "#0a85ea";
                }}
              >
                {authLoading ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>

            {/* Divider: "or continue with" */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "24px 0 20px 0",
                width: "100%"
              }}
            >
              <div style={{ flex: 1, height: "1px", background: isDark ? "#242528" : "#e5e7eb" }} />
              <span
                style={{
                  padding: "0 14px",
                  fontSize: "0.8rem",
                  color: isDark ? "#71747d" : "#9ca3af",
                  fontWeight: "500"
                }}
              >
                or continue with
              </span>
              <div style={{ flex: 1, height: "1px", background: isDark ? "#242528" : "#e5e7eb" }} />
            </div>

            {/* ONLY Google SSO Button (Clean, full-width, single provider) */}
            <div style={{ width: "100%", marginBottom: "28px" }}>
              <button
                type="button"
                onClick={() => {
                  setAuthError("");
                  setShowGoogleModal(true);
                }}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "8px",
                  border: `1.5px solid ${isDark ? "#2c2d30" : "#d1d5db"}`,
                  background: isDark ? "#141518" : "#ffffff",
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: "0.92rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "#3e4046" : "#cbd5e1";
                  e.currentTarget.style.background = isDark ? "#1c1d22" : "#f8fafc";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "#2c2d30" : "#d1d5db";
                  e.currentTarget.style.background = isDark ? "#141518" : "#ffffff";
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                }}
              >
                {/* Official Google 4-Color G Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.43l4.04-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: 6-DIGIT EMAIL VERIFICATION CODE WITH AUTO-CONNECT */
          /* ======================================================== */
          <div style={{ width: "100%", animation: "modalFadeIn 0.2s ease-out" }}>
            {/* Back to change email button */}
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setAuthError("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#0a85ea",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: "0 0 16px 0"
              }}
            >
              <ArrowLeft size={16} />
              <span>Use a different email</span>
            </button>

            {/* Recipient Notice */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "10px",
                background: isDark ? "#16171b" : "#f8fafc",
                border: `1px solid ${isDark ? "#28292e" : "#e2e8f0"}`,
                marginBottom: "20px"
              }}
            >
              <div style={{ fontSize: "0.78rem", color: isDark ? "#8e929b" : "#64748b", marginBottom: "4px" }}>
                Sent verification code to:
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", wordBreak: "break-all" }}>
                {emailAddress}
              </div>
            </div>

            {/* ⚡ 1-Click Auto Connect Banner */}
            {lastGeneratedEmailOtp && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: isDark
                    ? "linear-gradient(135deg, rgba(10, 133, 234, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)"
                    : "linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%)",
                  border: "1.5px solid #0a85ea",
                  marginBottom: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 4px 14px rgba(10, 133, 234, 0.15)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Zap size={16} style={{ color: "#0a85ea" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: isDark ? "#38bdf8" : "#0284c7" }}>
                      Security Code Ready
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      letterSpacing: "0.15em",
                      color: isDark ? "#ffffff" : "#0f172a"
                    }}
                  >
                    {lastGeneratedEmailOtp}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoConnect}
                  disabled={authLoading}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0a85ea",
                    color: "#ffffff",
                    fontSize: "0.88rem",
                    fontWeight: "700",
                    cursor: authLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 2px 6px rgba(10, 133, 234, 0.3)"
                  }}
                >
                  <Zap size={16} />
                  <span>⚡ Auto Connect with Code</span>
                </button>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <form onSubmit={handleVerifySubmit} style={{ width: "100%", marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: isDark ? "#c2c5cc" : "#374151",
                  marginBottom: "10px",
                  textAlign: "center"
                }}
              >
                Enter 6-digit verification code
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "20px" }}>
                {enteredOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (digitRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={authLoading}
                    style={{
                      width: "100%",
                      height: "54px",
                      borderRadius: "8px",
                      border: `1.5px solid ${digit ? "#0a85ea" : isDark ? "#2c2d30" : "#d1d5db"}`,
                      background: isDark ? "#141518" : "#ffffff",
                      color: isDark ? "#ffffff" : "#111827",
                      fontSize: "1.4rem",
                      fontWeight: "700",
                      textAlign: "center",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0a85ea";
                      e.target.style.boxShadow = "0 0 0 3px rgba(10, 133, 234, 0.15)";
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.style.borderColor = isDark ? "#2c2d30" : "#d1d5db";
                      }
                      e.target.style.boxShadow = "none";
                    }}
                  />
                ))}
              </div>

              {/* Manual Verify Button */}
              <button
                type="submit"
                disabled={authLoading || enteredOtp.join("").length < 6}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "8px",
                  border: "none",
                  background: enteredOtp.join("").length === 6 ? "#0a85ea" : isDark ? "#26272b" : "#e5e7eb",
                  color: enteredOtp.join("").length === 6 ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: enteredOtp.join("").length === 6 && !authLoading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.15s ease"
                }}
              >
                {authLoading ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Verifying & Connecting AWS...</span>
                  </>
                ) : (
                  <span>Verify & Log In</span>
                )}
              </button>
            </form>

            {/* Resend Code link */}
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              {countdown > 0 ? (
                <span style={{ fontSize: "0.82rem", color: isDark ? "#71747d" : "#9ca3af" }}>
                  Resend code in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#0a85ea",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Links matching Notion */}
        <div style={{ marginTop: "36px", textAlign: "center" }}>
          <div style={{ fontSize: "0.85rem", color: isDark ? "#888c94" : "#6b7280", marginBottom: "16px" }}>
            New user?{" "}
            <button
              type="button"
              onClick={() => handleQuickPreset("aryan.cloud@gmail.com")}
              style={{
                background: "transparent",
                border: "none",
                color: "#0a85ea",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline"
              }}
            >
              Sign up
            </button>
          </div>

          <p
            style={{
              fontSize: "0.74rem",
              color: isDark ? "#595c63" : "#9ca3af",
              lineHeight: "1.5",
              margin: 0,
              maxWidth: "360px"
            }}
          >
            By continuing, you acknowledge that you understand and agree to the{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms & Conditions</span> and{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* GOOGLE PERMISSION & DIRECT CONNECT MODAL */}
      {/* ======================================================== */}
      {showGoogleModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            animation: "modalFadeIn 0.2s ease-out"
          }}
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: isDark ? "#141518" : "#ffffff",
              borderRadius: "16px",
              border: `1px solid ${isDark ? "#2c2d30" : "#e5e7eb"}`,
              padding: "28px 24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              color: isDark ? "#ffffff" : "#111827"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>Continue with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: isDark ? "#8e929b" : "#64748b", margin: "0 0 18px 0" }}>
              Direct connect through Google with email permission code (OTP) to auto-verify your AWS workspace.
            </p>

            {/* Account Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {/* Option 1: Aryan Cloud Admin */}
              <div
                onClick={() => setSelectedGoogleAccount("aryan.cloud@gmail.com")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `1.5px solid ${selectedGoogleAccount === "aryan.cloud@gmail.com" ? "#0a85ea" : isDark ? "#28292d" : "#e5e7eb"}`,
                  background: selectedGoogleAccount === "aryan.cloud@gmail.com"
                    ? isDark ? "rgba(10, 133, 234, 0.12)" : "#eff6ff"
                    : isDark ? "#18191d" : "#f9fafb",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#0284c7",
                      color: "#fff",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem"
                    }}
                  >
                    A
                  </div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "700" }}>Aryan AWS FinOps</div>
                    <div style={{ fontSize: "0.78rem", color: isDark ? "#8e929b" : "#64748b" }}>aryan.cloud@gmail.com</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "#0a85ea",
                    color: "#fff",
                    fontWeight: "600"
                  }}
                >
                  Admin
                </span>
              </div>

              {/* Option 2: CloudOptix Admin */}
              <div
                onClick={() => setSelectedGoogleAccount("admin@cloudoptix.ai")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `1.5px solid ${selectedGoogleAccount === "admin@cloudoptix.ai" ? "#0a85ea" : isDark ? "#28292d" : "#e5e7eb"}`,
                  background: selectedGoogleAccount === "admin@cloudoptix.ai"
                    ? isDark ? "rgba(10, 133, 234, 0.12)" : "#eff6ff"
                    : isDark ? "#18191d" : "#f9fafb",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#ff9900",
                      color: "#fff",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem"
                    }}
                  >
                    C
                  </div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "700" }}>CloudOptix Admin</div>
                    <div style={{ fontSize: "0.78rem", color: isDark ? "#8e929b" : "#64748b" }}>admin@cloudoptix.ai</div>
                  </div>
                </div>
              </div>

              {/* Option 3: Custom Google Email */}
              <div
                onClick={() => setSelectedGoogleAccount("custom")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `1.5px solid ${selectedGoogleAccount === "custom" ? "#0a85ea" : isDark ? "#28292d" : "#e5e7eb"}`,
                  background: selectedGoogleAccount === "custom"
                    ? isDark ? "rgba(10, 133, 234, 0.12)" : "#eff6ff"
                    : isDark ? "#18191d" : "#f9fafb",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: selectedGoogleAccount === "custom" ? "8px" : "0" }}>
                  Use another Google account
                </div>
                {selectedGoogleAccount === "custom" && (
                  <input
                    type="email"
                    placeholder="user@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${isDark ? "#3e4046" : "#cbd5e1"}`,
                      background: isDark ? "#141518" : "#ffffff",
                      color: isDark ? "#ffffff" : "#111827",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Button A: Ask permission OTP on mail ID */}
              <button
                type="button"
                onClick={handleGooglePermissionOtp}
                disabled={authLoading}
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#0a85ea",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Zap size={16} />
                <span>Send Permission Code OTP & Auto-Connect</span>
              </button>

              {/* Button B: Direct 1-Click Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleDirectConnect}
                disabled={authLoading}
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  border: `1px solid ${isDark ? "#2c2d30" : "#d1d5db"}`,
                  background: isDark ? "#1e1f23" : "#f3f4f6",
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <span>Direct 1-Click Google Sign-In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
