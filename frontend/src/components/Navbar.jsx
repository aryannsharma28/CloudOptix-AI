import React, { useState, useEffect, useRef } from "react";
import { useCloud } from "../context/CloudContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Cloud,
  Layers,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  Activity,
  Server,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  PlusCircle,
  Database,
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

  const { user, isAuthenticated, logout } = useAuth();
  const { theme, resolvedTheme, setTheme, isDark } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const pendingRecs = recommendations.filter((r) => !r.applied).length;

  const navItems = [
    { id: "overview",        label: "Dashboard",         icon: Activity,    badge: null },
    { id: "resources",       label: `Fleet (${resources.length})`, icon: Layers, badge: null },
    { id: "ec2",             label: "EC2 Operations",    icon: Server,      badge: null },
    { id: "s3",              label: "S3 Storage",        icon: Database,    badge: null },
    { id: "recommendations", label: "AI Recommendations",icon: Sparkles,    badge: pendingRecs > 0 ? pendingRecs : null },
    { id: "forecast",        label: "Spend Forecast",    icon: TrendingUp,  badge: null },
    { id: "security",        label: "Security",          icon: ShieldCheck, badge: null },
  ];

  const tabLabels = {
    overview: "Executive Dashboard",
    resources: "Active Fleet",
    ec2: "EC2 Live Operations",
    s3: "S3 Storage Operations",
    recommendations: "AI Recommendations",
    forecast: "AI Spend Forecast",
    security: "Security & Compliance",
  };

  return (
    <>
      {/* ─────────────────────────────────────────
          SIDEBAR
      ───────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Cloud size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar-logo-name">CloudOptix</div>
            <div className="sidebar-logo-sub">AI Platform</div>
          </div>
        </div>

        {/* Connection status strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            margin: "10px 10px 2px",
            borderRadius: "8px",
            background: mode === "LIVE_AWS"
              ? "rgba(34,197,94,0.08)"
              : "rgba(239,68,68,0.08)",
            border: `1px solid ${mode === "LIVE_AWS" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            cursor: "pointer",
          }}
          onClick={() => setIsConnectModalOpen(true)}
          title="Click to configure AWS"
        >
          <span
            style={{
              width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
              background: mode === "LIVE_AWS" ? "var(--color-success)" : "var(--color-danger)",
              boxShadow: mode === "LIVE_AWS"
                ? "0 0 8px var(--color-success)"
                : "0 0 8px var(--color-danger)",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "0.72rem", fontWeight: "700", color: mode === "LIVE_AWS" ? "var(--color-success)" : "var(--color-danger)", letterSpacing: "0.04em" }}>
            {mode === "LIVE_AWS" ? "AWS CONNECTED" : "DISCONNECTED"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {account?.primaryRegion || "ap-south-1"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} className="sidebar-nav-icon" strokeWidth={1.8} />
              <span>{label}</span>
              {badge !== null && (
                <span className="sidebar-nav-badge">{badge}</span>
              )}
            </button>
          ))}

          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Actions</div>

          <button
            className="sidebar-nav-item"
            onClick={() => setIsConnectModalOpen(true)}
          >
            <Cloud size={16} className="sidebar-nav-icon" strokeWidth={1.8} />
            <span>{mode === "LIVE_AWS" ? "AWS Settings" : "Connect AWS"}</span>
          </button>

          <button
            className="sidebar-nav-item"
            onClick={() => setIsEnableModalOpen(true)}
          >
            <PlusCircle size={16} className="sidebar-nav-icon" strokeWidth={1.8} />
            <span>Enable Service</span>
          </button>

          <button
            className="sidebar-nav-item"
            onClick={resetSimulation}
            title="Refresh live telemetry from AWS"
          >
            <RotateCcw size={16} className="sidebar-nav-icon" strokeWidth={1.8} />
            <span>Sync AWS</span>
          </button>
        </nav>

        {/* Sidebar Footer — User Card */}
        {isAuthenticated && user && (
          <div className="sidebar-footer">
            <div
              className="sidebar-user-card"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              ref={profileRef}
            >
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f97316&color=fff&bold=true`}
                alt={user.name}
                className="sidebar-user-avatar"
              />
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: "var(--text-muted)",
                  transform: isProfileOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                  flexShrink: 0,
                }}
              />

              {/* Profile dropdown opens upwards */}
              {isProfileOpen && (
                <div
                  className="profile-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f97316&color=fff&bold=true`}
                      alt={user.name}
                      style={{ width: "38px", height: "38px", borderRadius: "9px", objectFit: "cover", border: "2px solid var(--border-card)" }}
                    />
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                      <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email || user.phoneNumber}</div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ padding: "11px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className="badge badge-neon-green" style={{ fontSize: "0.68rem" }}>
                        {user.authProvider === "GOOGLE" ? "Gmail Auth" : user.authProvider === "PHONE_OTP" ? "OTP Verified" : "Password Auth"}
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: "0.68rem" }}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Theme */}
                  <div style={{ padding: "11px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.07em", marginBottom: "8px" }}>
                      Appearance
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px", background: "var(--bg-base)", padding: "3px", borderRadius: "7px", border: "1px solid var(--border-subtle)" }}>
                      {[
                        { key: "light", label: "Light", Icon: Sun },
                        { key: "dark",  label: "Dark",  Icon: Moon },
                        { key: "system",label: "Auto",  Icon: Monitor },
                      ].map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTheme(key)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                            padding: "6px 4px", borderRadius: "5px", border: "none",
                            fontSize: "0.72rem", fontWeight: "600", cursor: "pointer",
                            background: theme === key ? "var(--bg-card)" : "transparent",
                            color: theme === key ? "var(--brand)" : "var(--text-muted)",
                            boxShadow: theme === key ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon size={12} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logout */}
                  <div style={{ paddingTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => { setIsProfileOpen(false); logout(); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "9px 12px", borderRadius: "8px",
                        border: "1px solid rgba(239,68,68,0.25)",
                        background: "rgba(239,68,68,0.08)",
                        color: "#ef4444",
                        fontSize: "0.82rem", fontWeight: "700", cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ─────────────────────────────────────────
          TOP BAR
      ───────────────────────────────────────── */}
      <header className="topbar">
        {/* Page title */}
        <div className="topbar-title">
          {tabLabels[activeTab] || "Dashboard"}
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 400, marginLeft: "6px" }}>
            / CloudOptix AI
          </span>
        </div>

        {/* Live stream toggle */}
        <div
          onClick={() => setIsLiveStreaming(!isLiveStreaming)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 11px", borderRadius: "20px", cursor: "pointer",
            background: isLiveStreaming
              ? (isDark ? "rgba(34,197,94,0.12)" : "rgba(22,163,74,0.08)")
              : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
            border: isLiveStreaming
              ? `1px solid ${isDark ? "rgba(34,197,94,0.3)" : "rgba(22,163,74,0.25)"}`
              : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            transition: "all 0.2s ease",
          }}
          title={isLiveStreaming ? "Live — click to pause" : "Paused — click to resume"}
        >
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
            background: isLiveStreaming ? "var(--color-success)" : "var(--text-muted)",
            animation: isLiveStreaming ? "pulse 1.5s infinite" : "none",
          }} />
          <span style={{
            fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.04em",
            color: isLiveStreaming ? "var(--color-success)" : "var(--text-muted)"
          }}>
            {isLiveStreaming ? "LIVE" : "PAUSED"}
          </span>
        </div>

        {/* Currency toggle */}
        <div className="currency-toggle">
          {["INR", "USD"].map((c) => (
            <button
              key={c}
              className={`currency-btn ${currency === c ? "active" : ""}`}
              onClick={() => setCurrency(c)}
            >
              {c === "INR" ? "₹ INR" : "$ USD"}
            </button>
          ))}
        </div>

        {/* ── THEME TOGGLE (Light / Dark) ── */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "34px", height: "34px",
            borderRadius: "8px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            color: isDark ? "#f0f0fa" : "#374151",
            cursor: "pointer",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isDark ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.10)";
            e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)";
            e.currentTarget.style.color = "#f97316";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
            e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
            e.currentTarget.style.color = isDark ? "#f0f0fa" : "#374151";
          }}
        >
          {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>

        {/* Connect AWS button */}
        <button
          className="btn btn-sm"
          onClick={() => setIsConnectModalOpen(true)}
          style={{
            background: mode === "LIVE_AWS"
              ? (isDark ? "rgba(34,197,94,0.15)" : "rgba(22,163,74,0.10)")
              : "var(--brand)",
            color: mode === "LIVE_AWS" ? "var(--color-success)" : "#fff",
            border: mode === "LIVE_AWS"
              ? `1px solid ${isDark ? "rgba(34,197,94,0.3)" : "rgba(22,163,74,0.25)"}`
              : "none",
            fontWeight: "700",
          }}
        >
          <Cloud size={13} />
          <span>{mode === "LIVE_AWS" ? "AWS Live" : "Connect AWS"}</span>
        </button>

        {/* Sync button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={resetSimulation}
          title="Sync from AWS"
          style={{ padding: "6px 10px" }}
        >
          <RotateCcw size={14} />
        </button>
      </header>
    </>
  );
};
