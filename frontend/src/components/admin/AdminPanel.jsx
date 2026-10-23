import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Cloud,
  DollarSign,
  TrendingDown,
  Activity,
  Server,
  Settings,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Database,
  Cpu,
  Sliders,
  ExternalLink,
  Search,
  Eye,
  UserCheck,
  UserX,
  Shield
} from "lucide-react";

export const AdminPanel = ({ onNavigateBack }) => {
  const { user, token, sessionToken } = useAuth();
  const { isDark } = useTheme();

  // Navigation state
  const [activeTab, setActiveTab] = useState("overview");

  // Authorization state
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Admin Data state
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [cloudAccounts, setCloudAccounts] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Filters & search
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/admin";

  const getActiveToken = () => {
    return (
      token ||
      sessionToken ||
      localStorage.getItem("cloudoptix_token") ||
      sessionStorage.getItem("cloudoptix_token") ||
      ""
    );
  };

  const getHeaders = () => {
    const active = getActiveToken();
    return {
      "Content-Type": "application/json",
      Authorization: active ? `Bearer ${active}` : ""
    };
  };

  // Verify Admin authorization on the server
  useEffect(() => {
    let isMounted = true;

    const verifyServerAuthorization = async () => {
      setIsVerifying(true);
      setAuthError(null);

      try {
        const res = await fetch(`${API_BASE}/verify`, {
          method: "GET",
          headers: getHeaders()
        });

        if (res.status === 401 || res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          if (isMounted) {
            setIsAuthorized(false);
            setAuthError(errData.error || errData.message || "403 Forbidden: You do not have administrator permissions to access this platform console.");
            setIsVerifying(false);
          }
          return;
        }

        const data = await res.json();
        if (data.success && isMounted) {
          setIsAuthorized(true);
          fetchAdminData();
        } else if (isMounted) {
          setIsAuthorized(false);
          setAuthError("Failed to verify administrator privileges.");
        }
      } catch (err) {
        if (isMounted) {
          setIsAuthorized(false);
          setAuthError(`Backend communication failure: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifyServerAuthorization();

    return () => {
      isMounted = false;
    };
  }, [token, sessionToken]);

  // Fetch all admin data
  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const headers = getHeaders();
      const [statsRes, usersRes, accountsRes, logsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/users`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/cloud-accounts`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/audit-logs`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/settings`, { headers }).then((r) => (r.ok ? r.json() : null))
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (usersRes?.data) setUsersList(usersRes.data);
      if (accountsRes?.data) setCloudAccounts(accountsRes.data);
      if (logsRes?.data) setAuditLogs(logsRes.data);
      if (settingsRes?.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Update a user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: `Updated user role to ${newRole}` });
        fetchAdminData();
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to update role" });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Platform settings updated successfully." });
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to save settings." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. LOADING STATE
  if (isVerifying) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          padding: "24px"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "440px" }} className="glass-card">
          <RefreshCw
            size={36}
            style={{
              color: "var(--aws-orange)",
              animation: "spin 1.2s linear infinite",
              margin: "0 auto 16px"
            }}
          />
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "8px" }}>
            Verifying Administrator Authorization
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Communicating with CloudOptix IAM service and evaluating role-based security policies...
          </p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // 2. UNAUTHORIZED / 403 ACCESS DENIED STATE (Strictly NO admin data rendered)
  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          padding: "24px",
          color: "var(--text-primary)"
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: "520px",
            width: "100%",
            padding: "40px",
            textAlign: "center",
            borderRadius: "18px",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <span
            className="badge badge-rose"
            style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              letterSpacing: "0.08em",
              marginBottom: "12px",
              display: "inline-block"
            }}
          >
            HTTP 403 FORBIDDEN
          </span>

          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "12px", color: "var(--text-heading)" }}>
            Access Denied
          </h1>

          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.6", marginBottom: "20px" }}>
            {authError || "You do not have administrative privileges to access this area."}
          </p>

          <div
            style={{
              background: "var(--bg-subtle)",
              padding: "14px",
              borderRadius: "10px",
              fontSize: "0.8rem",
              textAlign: "left",
              marginBottom: "24px",
              border: "1px solid var(--border-subtle)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "var(--text-muted)" }}>Current User:</span>
              <span style={{ fontWeight: "600" }}>{user?.email || user?.phoneNumber || "Anonymous"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "var(--text-muted)" }}>Assigned Role:</span>
              <span style={{ fontWeight: "600", color: "#f59e0b" }}>{user?.role || "USER"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Security Status:</span>
              <span style={{ fontWeight: "600", color: "#ef4444" }}>ACCESS_REJECTED</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateBack}
            className="btn btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px"
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to User Console</span>
          </button>
        </div>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phoneNumber?.includes(userSearch);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // 3. AUTHORIZED ADMIN PANEL APPLICATION
  return (
    <div
      className="admin-console-wrapper"
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Admin Top Navigation Bar */}
      <header
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 12px",
              background: "rgba(255, 153, 0, 0.12)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 153, 0, 0.3)"
            }}
          >
            <ShieldCheck size={20} style={{ color: "var(--aws-orange)" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-heading)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>CloudOptix AI</span>
                <span style={{ fontSize: "0.68rem", background: "var(--aws-orange)", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>
                  ADMIN CONSOLE
                </span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Restricted Management Infrastructure
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "12px" }}>
            <span className="badge badge-neon-green" style={{ fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
              SYS HEALTH: OPERATIONAL
            </span>
            {stats?.systemHealth?.uptimeHuman && (
              <span className="badge badge-subtle" style={{ fontSize: "0.72rem" }}>
                Uptime: {stats.systemHealth.uptimeHuman}
              </span>
            )}
          </div>
        </div>

        {/* Right side admin controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={fetchAdminData}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="Refresh All Telemetry"
          >
            <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={onNavigateBack}
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={14} />
            <span>Return to User Console</span>
          </button>
        </div>
      </header>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            background: statusMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            borderBottom: `1px solid ${statusMessage.type === "success" ? "#10b981" : "#ef4444"}`,
            color: statusMessage.type === "success" ? "#10b981" : "#ef4444",
            padding: "8px 24px",
            fontSize: "0.85rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Admin Workspace */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Admin Sidebar Navigation */}
        <aside
          style={{
            width: "240px",
            background: "var(--bg-card)",
            borderRight: "1px solid var(--border-subtle)",
            padding: "20px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <div style={{ padding: "0 10px 10px", fontSize: "0.7rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Platform Modules
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: activeTab === "overview" ? "rgba(255, 153, 0, 0.15)" : "transparent",
              color: activeTab === "overview" ? "var(--aws-orange)" : "var(--text-primary)",
              textAlign: "left"
            }}
          >
            <Activity size={16} />
            <span>Platform Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: activeTab === "users" ? "rgba(255, 153, 0, 0.15)" : "transparent",
              color: activeTab === "users" ? "var(--aws-orange)" : "var(--text-primary)",
              textAlign: "left"
            }}
          >
            <Users size={16} />
            <span>Users & IAM</span>
            {usersList.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: "10px" }}>
                {usersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cloud")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: activeTab === "cloud" ? "rgba(255, 153, 0, 0.15)" : "transparent",
              color: activeTab === "cloud" ? "var(--aws-orange)" : "var(--text-primary)",
              textAlign: "left"
            }}
          >
            <Cloud size={16} />
            <span>Cloud & AWS Fleets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: activeTab === "audit" ? "rgba(255, 153, 0, 0.15)" : "transparent",
              color: activeTab === "audit" ? "var(--aws-orange)" : "var(--text-primary)",
              textAlign: "left"
            }}
          >
            <Lock size={16} />
            <span>Audit & Security Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: activeTab === "settings" ? "rgba(255, 153, 0, 0.15)" : "transparent",
              color: activeTab === "settings" ? "var(--aws-orange)" : "var(--text-primary)",
              textAlign: "left"
            }}
          >
            <Settings size={16} />
            <span>System Settings</span>
          </button>
        </aside>

        {/* Tab Content Area */}
        <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 6px" }}>
                  System Health & Platform Metrics
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                  Real-time telemetry aggregated across registered users, AWS cloud connectors, and optimization pipelines.
                </p>
              </div>

              {/* KPI Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                  marginBottom: "28px"
                }}
              >
                <div className="glass-card" style={{ padding: "20px", borderRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Total Registered Users</span>
                    <Users size={20} style={{ color: "#0ea5e9" }} />
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-heading)" }}>
                    {stats?.totalUsers || usersList.length || 0}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "6px" }}>
                    Active Sessions: {stats?.activeUsers || 1}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: "20px", borderRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Cloud Accounts Connected</span>
                    <Cloud size={20} style={{ color: "var(--aws-orange)" }} />
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-heading)" }}>
                    {stats?.connectedCloudAccounts || 0}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                    Mode: {stats?.cloudConnectionMode || "ONLINE"}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: "20px", borderRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Tracked Cloud Spend</span>
                    <DollarSign size={20} style={{ color: "#10b981" }} />
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-heading)" }}>
                    ${(stats?.totalCloudSpend || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "6px" }}>
                    Monthly Explorer Aggregation
                  </div>
                </div>

                <div className="glass-card" style={{ padding: "20px", borderRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Potential Savings</span>
                    <TrendingDown size={20} style={{ color: "#a855f7" }} />
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-heading)" }}>
                    ${(stats?.potentialSavings || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                    {stats?.optimizationOpportunities || 0} Unresolved Recommendations
                  </div>
                </div>
              </div>

              {/* System Diagnostics & User Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Diagnostics */}
                <div className="glass-card" style={{ padding: "22px", borderRadius: "14px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Cpu size={18} style={{ color: "var(--aws-orange)" }} />
                    <span>Host Node.js Process Diagnostics</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.84rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Node.js Runtime</span>
                      <span style={{ fontWeight: "600" }}>{stats?.systemHealth?.nodeVersion || "v20.x"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Host OS Platform</span>
                      <span style={{ fontWeight: "600" }}>{stats?.systemHealth?.platform || "win32 (Windows)"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Resident Memory (RSS)</span>
                      <span style={{ fontWeight: "600" }}>{stats?.systemHealth?.memoryRssMb || 45} MB</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Process Uptime</span>
                      <span style={{ fontWeight: "600", color: "#10b981" }}>{stats?.systemHealth?.uptimeHuman || "Online"}</span>
                    </div>
                  </div>
                </div>

                {/* IAM Role Distribution */}
                <div className="glass-card" style={{ padding: "22px", borderRadius: "14px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={18} style={{ color: "#0ea5e9" }} />
                    <span>IAM Role Distribution</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.84rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Administrators (Superuser)</span>
                      <span style={{ fontWeight: "700", color: "#ef4444" }}>{stats?.userBreakdown?.admins || 1}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-muted)" }}>FinOps Leads</span>
                      <span style={{ fontWeight: "700", color: "var(--aws-orange)" }}>{stats?.userBreakdown?.finopsLeads || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Standard Cloud Consumers</span>
                      <span style={{ fontWeight: "700", color: "#0ea5e9" }}>{stats?.userBreakdown?.standardUsers || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS & IAM TAB */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 6px" }}>
                    User Management & Role-Based Access Control
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                    Assign and revoke administrator and FinOps privileges. Access changes take effect instantly across active sessions.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        padding: "8px 12px 8px 32px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: "0.84rem",
                        width: "200px"
                      }}
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      fontSize: "0.84rem"
                    }}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">ADMIN Only</option>
                    <option value="FINOPS_LEAD">FINOPS_LEAD</option>
                    <option value="USER">Standard USER</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="glass-card" style={{ borderRadius: "14px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>User</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Identifier</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Provider</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Assigned Role</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Manage Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                          No users match the search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isCurrent = u.id === user?.id || u.email === user?.email;
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img
                                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=0284c7&color=fff`}
                                  alt={u.name}
                                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                                />
                                <div>
                                  <div style={{ fontWeight: "700", color: "var(--text-heading)" }}>
                                    {u.name} {isCurrent && <span style={{ fontSize: "0.7rem", color: "var(--aws-orange)" }}>(You)</span>}
                                  </div>
                                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                    ID: {u.id?.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "14px 18px", color: "var(--text-primary)" }}>
                              {u.email || u.phoneNumber}
                            </td>
                            <td style={{ padding: "14px 18px" }}>
                              <span className="badge badge-subtle" style={{ fontSize: "0.72rem" }}>
                                {u.authProvider || "PASSWORD"}
                              </span>
                            </td>
                            <td style={{ padding: "14px 18px" }}>
                              <span
                                className={`badge ${
                                  u.role === "ADMIN" ? "badge-rose" : u.role === "FINOPS_LEAD" ? "badge-purple" : "badge-neon-cyan"
                                }`}
                                style={{ fontSize: "0.75rem", fontWeight: "700" }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: "14px 18px" }}>
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                disabled={isCurrent && u.role === "ADMIN"}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--border-subtle)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-primary)",
                                  fontSize: "0.8rem",
                                  cursor: isCurrent && u.role === "ADMIN" ? "not-allowed" : "pointer"
                                }}
                                title={isCurrent && u.role === "ADMIN" ? "Cannot remove your own admin privilege" : "Update role"}
                              >
                                <option value="USER">USER (Standard)</option>
                                <option value="FINOPS_LEAD">FINOPS_LEAD</option>
                                <option value="ADMIN">ADMIN (Superuser)</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CLOUD ACCOUNTS & FLEET */}
          {activeTab === "cloud" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 6px" }}>
                  Cloud Accounts & Fleet Ingestion
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                  Real-time AWS account connections, Cost Explorer integration, and instance telemetry feeds.
                </p>
              </div>

              <div className="glass-card" style={{ padding: "24px", borderRadius: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255, 153, 0, 0.15)", color: "var(--aws-orange)" }}>
                      <Server size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
                        {cloudAccounts?.accountName || "Primary AWS Infrastructure"}
                      </h3>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Account ID: {cloudAccounts?.accountId || "Unconnected"} &bull; Region: {cloudAccounts?.region || "us-east-1"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`badge ${cloudAccounts?.mode === "LIVE_AWS" ? "badge-neon-green" : "badge-subtle"}`}
                    style={{ fontSize: "0.78rem", fontWeight: "700" }}
                  >
                    {cloudAccounts?.mode === "LIVE_AWS" ? "LIVE AWS CONNECTED" : "LOCAL SIMULATION"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginTop: "16px" }}>
                  <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Active Fleets</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "700" }}>{stats?.activeResourcesCount || 0} Instances</div>
                  </div>
                  <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Ingestion Health</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#10b981" }}>Healthy</div>
                  </div>
                  <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Telemetry Status</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--aws-orange)" }}>
                      {cloudAccounts?.mode === "LIVE_AWS" ? "Polling Live" : "Idle"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. AUDIT LOGS */}
          {activeTab === "audit" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 6px" }}>
                  System Activity & Security Audit Logs
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                  Immutable log of authentication events, administrative actions, and authorization decisions.
                </p>
              </div>

              <div className="glass-card" style={{ borderRadius: "14px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Timestamp</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Action</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Initiator</th>
                      <th style={{ padding: "12px 18px", color: "var(--text-muted)", fontWeight: "700" }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                          No audit log records available.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "12px 18px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <span className="badge badge-purple" style={{ fontSize: "0.72rem", fontWeight: "700" }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: "600" }}>
                            {log.userEmail || "SYSTEM"}
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-primary)" }}>
                            {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "-")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. SETTINGS */}
          {activeTab === "settings" && (
            <div style={{ maxWidth: "680px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 6px" }}>
                  Platform Configuration & Governance
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                  Adjust platform-wide telemetry synchronization, anomaly threshold levels, and security guardrails.
                </p>
              </div>

              {settings && (
                <form onSubmit={handleSaveSettings} className="glass-card" style={{ padding: "26px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px" }}>
                      Telemetry Auto-Sync Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={settings.autoSyncIntervalMinutes || 15}
                      onChange={(e) => setSettings({ ...settings, autoSyncIntervalMinutes: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-subtle)",
                        color: "var(--text-primary)"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px" }}>
                      Anomaly Detection Sensitivity (0.1 to 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={settings.maxAnomalySensitivity || 0.85}
                      onChange={(e) => setSettings({ ...settings, maxAnomalySensitivity: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-subtle)",
                        color: "var(--text-primary)"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                    <input
                      type="checkbox"
                      id="readOnlyEnforcement"
                      checked={settings.readOnlyEnforcement || false}
                      onChange={(e) => setSettings({ ...settings, readOnlyEnforcement: e.target.checked })}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <label htmlFor="readOnlyEnforcement" style={{ fontSize: "0.85rem", cursor: "pointer" }}>
                      <strong>Enforce Read-Only Guardrails</strong> (Prevents destructive actions directly affecting AWS production infrastructure)
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenanceMode || false}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <label htmlFor="maintenanceMode" style={{ fontSize: "0.85rem", cursor: "pointer" }}>
                      <strong>Platform Maintenance Mode</strong> (Restricts non-admin user sessions to read-only views)
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ alignSelf: "flex-start", padding: "10px 24px" }}
                  >
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
