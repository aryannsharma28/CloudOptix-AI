import React, { useState, useEffect, useRef } from "react";
import { useCloud } from "../context/CloudContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Cloud,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck,
  RotateCcw,
  Activity,
  Server,
  User,
  LogOut,
  ChevronDown,
  Phone,
  Mail,
  CheckCircle2,
  KeyRound,
  Sun,
  Moon,
  Monitor,
  PlusCircle,
  Radio,
  Database
} from "lucide-react";

export const Navbar = () => {
  const {
    activeTab,
    setActiveTab,
    currency,
    setCurrency,
    account,
    mode,
    recommendations,
    resources,
    resetSimulation,
    setIsConnectModalOpen,
    isLiveStreaming,
    setIsLiveStreaming,
    setIsEnableModalOpen
  } = useCloud();

  const { user, isAuthenticated, isAdmin, setIsAuthModalOpen, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const pendingRecommendations = recommendations.filter((r) => !r.applied).length;

  return (
    <header className="navbar-container">
      {/* Top Banner */}
      <div className="top-banner">
        <div className="brand-section">
          <div className="brand-logo">
            <Cloud className="text-neon-cyan" size={28} />
          </div>
          <div className="brand-info">
            <div className="brand-title-row">
              <h1 className="brand-title">CloudOptix AI</h1>
              <span className="badge badge-cream">FinOps & AI Platform</span>
            </div>
            <p className="brand-subtitle">
              Intelligent AWS Cost Optimization & Auto-Scaling Management
            </p>
          </div>
        </div>

        <div className="top-actions">
          {/* Cloud Account Badge - Clickable to open Connect modal */}
          <div
            className="account-badge glass-panel"
            style={{ cursor: "pointer" }}
            onClick={() => setIsConnectModalOpen(true)}
            title="Click to view AWS cloud connection settings"
          >
            <Server size={14} className="text-neon-cyan" />
            <span><strong>{mode === "LIVE_AWS" ? "AWS Cloud" : "AWS Disconnected"}</strong></span>
            <span className="separator">•</span>
            <span>{account?.primaryRegion || "ap-south-1"}</span>
          </div>

          {/* Connect AWS Account Action Button */}
          <button
            className={`btn btn-sm ${mode === "LIVE_AWS" ? "btn-secondary" : "btn-primary"}`}
            onClick={() => setIsConnectModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: mode === "LIVE_AWS" ? "#ecfdf5" : "var(--aws-orange)",
              color: mode === "LIVE_AWS" ? "#065f46" : "#ffffff",
              border: mode === "LIVE_AWS" ? "1px solid #a7f3d0" : "none",
              fontWeight: "600"
            }}
            title="Configure AWS IAM credentials or Role"
          >
            <Cloud size={14} />
            <span>{mode === "LIVE_AWS" ? "AWS Connected" : "Connect AWS"}</span>
          </button>

          {/* Live Telemetry Mode */}
          <div className="mode-badge glass-panel">
            {mode === "LIVE_AWS" ? (
              <>
                <span className="pulse-dot text-neon-green"></span>
                <span className="font-semibold" style={{ color: "#059669" }}>
                  AWS LIVE API
                </span>
              </>
            ) : (
              <>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#94a3b8" }}></span>
                <span className="font-semibold" style={{ color: "#64748b" }}>
                  DISCONNECTED
                </span>
              </>
            )}
          </div>

          {/* Live Telemetry Streaming Beacon */}
          <div
            className="glass-panel"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              cursor: "pointer",
              background: isLiveStreaming ? "rgba(16, 185, 129, 0.12)" : "rgba(148, 163, 184, 0.12)",
              border: isLiveStreaming ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)"
            }}
            title={isLiveStreaming ? "Streaming live telemetry (1s ticker) - Click to pause" : "Streaming paused - Click to resume"}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: isLiveStreaming ? "#10b981" : "#94a3b8",
                animation: isLiveStreaming ? "pulse 1.5s infinite" : "none"
              }}
            />
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: isLiveStreaming ? "#10b981" : "#94a3b8" }}>
              {isLiveStreaming ? "LIVE STREAM" : "PAUSED"}
            </span>
          </div>

          {/* Quick Enable AWS Service Button */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsEnableModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              border: "none",
              fontWeight: "700",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
            }}
            title="Enable an AWS service on a specific start date"
          >
            <PlusCircle size={14} />
            <span>+ Enable Service</span>
          </button>

          {/* Currency Switcher */}
          <div className="currency-toggle glass-panel">
            <button
              className={`currency-btn ${currency === "INR" ? "active" : ""}`}
              onClick={() => setCurrency("INR")}
              title="Show in Indian Rupees"
            >
              ₹ INR
            </button>
            <button
              className={`currency-btn ${currency === "USD" ? "active" : ""}`}
              onClick={() => setCurrency("USD")}
              title="Show in US Dollars"
            >
              $ USD
            </button>
          </div>

          {/* Sync Live AWS Telemetry Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={resetSimulation}
            title="Refresh live telemetry directly from AWS"
          >
            <RotateCcw size={14} />
            <span>Sync AWS</span>
          </button>

          {/* USER AUTHENTICATION / PROFILE / LOGOUT SECTION */}
          {isAuthenticated && user && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ position: "relative" }} ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  aria-expanded={isProfileMenuOpen}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 10px 4px 6px",
                    borderRadius: "20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                    color: "var(--text-primary)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff`
                    }
                    alt={user.name}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-primary)", maxWidth: "110px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: isProfileMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
                </button>

                {/* User Menu Dropdown (ONLY LOCATION FOR LOGOUT) */}
                {isProfileMenuOpen && (
                  <div
                    className="profile-dropdown"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "115%",
                      width: "280px",
                      maxWidth: "calc(100vw - 32px)",
                      background: "var(--bg-card)",
                      borderRadius: "14px",
                      boxShadow: "var(--shadow-hover)",
                      border: "1px solid var(--border-card)",
                      padding: "14px",
                      zIndex: 9999,
                      animation: "modalFadeIn 0.18s ease-out"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* User Info Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff`}
                        alt={user.name}
                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-subtle)" }}
                      />
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.email || user.phoneNumber}
                        </div>
                      </div>
                    </div>

                    {/* Role & Security Badges */}
                    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "6px" }}>
                        Role & Security
                      </div>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <span className="badge badge-neon-green" style={{ fontSize: "0.7rem" }}>
                          {user.authProvider === "GOOGLE" ? "Gmail Authenticated" : user.authProvider === "PHONE_OTP" ? "Phone OTP Verified" : "Password Authenticated"}
                        </span>
                        <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Theme / Appearance Control */}
                    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Appearance</span>
                        <span style={{ textTransform: "capitalize", color: "var(--aws-orange)", fontWeight: "600" }}>{resolvedTheme}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", background: "var(--bg-subtle)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            background: theme === "light" ? "var(--bg-card)" : "transparent",
                            color: theme === "light" ? "var(--aws-orange)" : "var(--text-muted)",
                            boxShadow: theme === "light" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s ease"
                          }}
                          title="Light Mode"
                        >
                          <Sun size={13} />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            background: theme === "dark" ? "var(--bg-card)" : "transparent",
                            color: theme === "dark" ? "var(--aws-orange)" : "var(--text-muted)",
                            boxShadow: theme === "dark" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s ease"
                          }}
                          title="Dark Mode"
                        >
                          <Moon size={13} />
                          <span>Dark</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("system")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            background: theme === "system" ? "var(--bg-card)" : "transparent",
                            color: theme === "system" ? "var(--aws-orange)" : "var(--text-muted)",
                            boxShadow: theme === "system" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s ease"
                          }}
                          title="Follow System Theme"
                        >
                          <Monitor size={13} />
                          <span>Auto</span>
                        </button>
                      </div>
                    </div>

                    {/* Sole Logout Button in the Application */}
                    <div style={{ paddingTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          background: "rgba(239, 68, 68, 0.08)",
                          color: "#ef4444",
                          fontSize: "0.84rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <LogOut size={15} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs-wrapper">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={16} />
            <span>Executive Dashboard</span>
          </button>

          <button
            className={`nav-tab ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            <Layers size={16} />
            <span>Active Fleet ({resources.length})</span>
          </button>

          <button
            className={`nav-tab ${activeTab === "ec2" ? "active" : ""}`}
            onClick={() => setActiveTab("ec2")}
          >
            <Server size={16} style={{ color: activeTab === "ec2" ? "#ff9900" : "inherit" }} />
            <span>EC2 Live Operations</span>
          </button>

          <button
            className={`nav-tab ${activeTab === "s3" ? "active" : ""}`}
            onClick={() => setActiveTab("s3")}
          >
            <Database size={16} style={{ color: activeTab === "s3" ? "#10b981" : "inherit" }} />
            <span>S3 Storage Operations</span>
          </button>

          <button
            className={`nav-tab ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            <Sparkles size={16} />
            <span>AI Recommendations</span>
            {pendingRecommendations > 0 && (
              <span className="tab-badge">{pendingRecommendations}</span>
            )}
          </button>

          <button
            className={`nav-tab ${activeTab === "forecast" ? "active" : ""}`}
            onClick={() => setActiveTab("forecast")}
          >
            <TrendingUp size={16} />
            <span>AI Spend Forecast</span>
          </button>

          <button
            className={`nav-tab ${activeTab === "k8s" ? "active" : ""}`}
            onClick={() => setActiveTab("k8s")}
          >
            <Cpu size={16} />
            <span>Kubernetes & HPA</span>
          </button>

          <button
            className={`nav-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <ShieldCheck size={16} />
            <span>Security & Compliance</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
