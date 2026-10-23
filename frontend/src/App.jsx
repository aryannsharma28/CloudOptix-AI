import React, { useState, useEffect } from "react";
import { CloudProvider, useCloud } from "./context/CloudContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { AdminPanel } from "./components/admin/AdminPanel";
import { Navbar } from "./components/Navbar";
import { MetricCards } from "./components/MetricCards";
import { CostBreakdown } from "./components/CostBreakdown";
import { RecommendationsList } from "./components/RecommendationsList";
import { ResourceTable } from "./components/ResourceTable";
import { ForecastSection } from "./components/ForecastSection";
import { SecurityScanner } from "./components/SecurityScanner";
import { Ec2ControlCenter } from "./components/Ec2ControlCenter";
import { Ec2LiveTelemetryBanner } from "./components/Ec2LiveTelemetryBanner";
import { S3ControlCenter } from "./components/S3ControlCenter";
import { S3LiveTelemetryBanner } from "./components/S3LiveTelemetryBanner";
import { AirBubbles } from "./components/AirBubbles";
import { CircleScrollTurn } from "./components/CircleScrollTurn";
import { ConnectAwsModal } from "./components/ConnectAwsModal";
import { EnableServiceModal } from "./components/EnableServiceModal";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw
} from "lucide-react";
import "./App.css";

const DashboardContent = () => {
  const { activeTab, loading, isSyncing, error, toast, refreshData, summary } = useCloud();

  if (loading && !summary) {
    return (
      <div className="app-shell">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100vh", width: "100%", flexDirection: "column", gap: "20px",
          background: "var(--bg-base)"
        }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #f97316, #c2410c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 32px rgba(249,115,22,0.5)"
          }}>
            <RefreshCw size={24} color="#fff" style={{ animation: "spin 1.5s linear infinite" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: "800", color: "var(--text-heading)", marginBottom: "6px" }}>
              Connecting to Cloud Telemetry...
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Querying AWS Cost Explorer, CloudWatch & FinOps ML engine
            </p>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="app-shell">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100vh", width: "100%", flexDirection: "column", gap: "20px",
          background: "var(--bg-base)"
        }}>
          <div className="glass-card" style={{ maxWidth: "520px", padding: "36px", textAlign: "center" }}>
            <AlertCircle size={40} style={{ color: "var(--color-danger)", margin: "0 auto 16px", display: "block" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", color: "var(--color-danger)", marginBottom: "8px", fontWeight: "800" }}>
              Backend Service Offline
            </h2>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "22px" }}>{error}</p>
            <button className="btn btn-primary" onClick={() => refreshData(false)}>
              <RefreshCw size={15} /> Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Ambient background bubbles */}
      <AirBubbles />

      {/* Modals */}
      <ConnectAwsModal />
      <EnableServiceModal />

      {/* Toast */}
      {toast && (
        <div className={`toast-banner toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Live sync progress bar */}
      {isSyncing && (
        <div className="sync-shimmer-bar" />
      )}

      {/* Sidebar + TopBar */}
      <Navbar />

      {/* Main scrollable content */}
      <div className="app-content">
        <main className="main-content-view">
          {activeTab === "overview" && (
            <>
              <MetricCards />
              <Ec2LiveTelemetryBanner />
              <S3LiveTelemetryBanner />
              <CostBreakdown />
              <RecommendationsList />
              <ResourceTable />
            </>
          )}
          {activeTab === "resources"       && <ResourceTable />}
          {activeTab === "ec2"             && <Ec2ControlCenter />}
          {activeTab === "s3"              && <S3ControlCenter />}
          {activeTab === "recommendations" && <RecommendationsList />}
          {activeTab === "forecast"        && <ForecastSection />}
          {activeTab === "security"        && <SecurityScanner />}
        </main>
      </div>

      <CircleScrollTurn />
    </div>
  );
};

/* ─── Error Boundary ─── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg-base)", color: "var(--text-primary)", padding: "24px"
        }}>
          <div className="glass-card" style={{ maxWidth: "520px", padding: "32px", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "8px", color: "var(--text-heading)" }}>
              Render Error
            </h2>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "22px" }}>
              {this.state.error?.message || "An unexpected error occurred while rendering this view."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button type="button" className="btn btn-secondary" onClick={() => this.setState({ hasError: false, error: null })}>
                Retry
              </button>
              <button type="button" className="btn btn-primary" onClick={() => { window.location.hash = ""; window.location.pathname = "/"; }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── App Gate ─── */
const AppGate = () => {
  const { isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return (p === "/admin" || p.startsWith("/admin/") || h === "#admin" || h.startsWith("#admin")) ? "/admin" : "/";
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      setCurrentPath((p === "/admin" || p.startsWith("/admin/") || h === "#admin" || h.startsWith("#admin")) ? "/admin" : "/");
    };
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    try {
      window.history.replaceState(null, "", path);
      if (window.location.hash) window.location.hash = "";
    } catch {}
    setCurrentPath(path);
  };

  if (!isAuthenticated) return <LoginPage />;

  if (currentPath === "/admin") {
    return (
      <ErrorBoundary>
        <AdminPanel onNavigateBack={() => navigateTo("/")} />
      </ErrorBoundary>
    );
  }

  return (
    <CloudProvider>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </CloudProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
