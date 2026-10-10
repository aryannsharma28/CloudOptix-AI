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
import { K8sAutoscaling } from "./components/K8sAutoscaling";
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
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, loading, isSyncing, error, toast, refreshData, summary } = useCloud();

  // Only show full blocking loader on cold boot if no summary is available yet
  if (loading && !summary) {
    return (
      <div className="loading-container glass-card" style={{ padding: "60px", textAlign: "center", margin: "40px auto", maxWidth: "600px" }}>
        <RefreshCw className="animate-spin text-neon-green" size={36} style={{ animation: "spin 1.5s linear infinite", margin: "0 auto 16px" }} />
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "8px", color: "var(--text-white)" }}>Connecting to Cloud Telemetry...</h2>
        <p className="text-secondary text-sm">Querying AWS Cost Explorer, CloudWatch metrics, and FinOps ML engine.</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Only show full offline error if completely disconnected without cached data
  if (error && !summary) {
    return (
      <div className="error-container glass-card" style={{ padding: "40px", textAlign: "center", margin: "40px auto", maxWidth: "600px", borderColor: "var(--neon-rose)" }}>
        <AlertCircle className="text-rose" size={40} style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontFamily: "var(--font-heading)", color: "var(--neon-rose)", marginBottom: "8px" }}>Backend Service Offline</h2>
        <p className="text-secondary text-sm" style={{ marginBottom: "20px" }}>{error}</p>
        <button className="btn btn-primary" onClick={() => refreshData(false)}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Non-blocking Subtle Live Sync Progress Bar across top of viewport */}
      {isSyncing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #10b981, #06b6d4, #6366f1, #10b981)",
            backgroundSize: "200% 100%",
            animation: "subtleShimmer 1.5s infinite linear",
            zIndex: 99999,
            pointerEvents: "none"
          }}
        />
      )}
      <style>{`
        @keyframes subtleShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Floating Air Bubbles Effect */}
      <AirBubbles />

      {/* Connect AWS Account Modal */}
      <ConnectAwsModal />

      {/* Enable AWS Service Modal */}
      <EnableServiceModal />

      {/* Dynamic Toast Feedback */}
      {toast && (
        <div className={`toast-banner toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <Info size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header with AWS Live Account & User Profile */}
      <Navbar />

      {/* Tab-based View Switcher */}
      <main className="main-content-view">
        {activeTab === "overview" && (
          <>
            {/* Top 5 KPI Metrics */}
            <MetricCards />

            {/* Live EC2 Fleet Telemetry & Workload Ribbon */}
            <Ec2LiveTelemetryBanner />

            {/* Live S3 Fleet Telemetry & Storage Ribbon */}
            <S3LiveTelemetryBanner />

            {/* Service Breakdown & Historical Spend */}
            <CostBreakdown />

            {/* AI Recommendations */}
            <RecommendationsList />

            {/* Resource Fleet Table */}
            <ResourceTable />
          </>
        )}

        {activeTab === "resources" && <ResourceTable />}

        {activeTab === "ec2" && <Ec2ControlCenter />}

        {activeTab === "s3" && <S3ControlCenter />}

        {activeTab === "recommendations" && <RecommendationsList />}

        {activeTab === "forecast" && <ForecastSection />}

        {activeTab === "k8s" && <K8sAutoscaling />}

        {activeTab === "security" && <SecurityScanner />}
      </main>

      {/* Interactive Circular Turn Scroll Widget */}
      <CircleScrollTurn />
    </div>
  );
};

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
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            padding: "24px"
          }}
        >
          <div className="glass-card" style={{ maxWidth: "520px", padding: "32px", textAlign: "center", borderRadius: "16px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "8px", color: "var(--text-heading)" }}>
              Console Render Notice
            </h2>
            <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "20px" }}>
              {this.state.error?.message || "An unexpected error occurred while rendering this view."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Retry
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  window.location.hash = "";
                  window.location.pathname = "/";
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppGate = () => {
  const { isAuthenticated } = useAuth();

  const [currentPath, setCurrentPath] = useState(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    if (p === "/admin" || p === "/admin/" || p.startsWith("/admin/") || h === "#admin" || h.startsWith("#admin")) {
      return "/admin";
    }
    return "/";
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p === "/admin" || p === "/admin/" || p.startsWith("/admin/") || h === "#admin" || h.startsWith("#admin")) {
        setCurrentPath("/admin");
      } else {
        setCurrentPath("/");
      }
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
      if (window.location.hash) {
        window.location.hash = "";
      }
    } catch {}
    setCurrentPath(path);
  };

  // STRICT AUTHENTICATION GATE:
  // If not authenticated, render ONLY the standalone LoginPage.
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // SECURE ADMIN ROUTE:
  // Renders strictly when the user has entered the /admin route.
  // Protected with server-side role validation in AdminPanel (403 for non-admins).
  if (currentPath === "/admin") {
    return (
      <ErrorBoundary>
        <AdminPanel onNavigateBack={() => navigateTo("/")} />
      </ErrorBoundary>
    );
  }

  // STANDARD USER EXPERIENCE:
  // Normal users only see standard CloudOptix FinOps dashboard.
  // Absolutely no Admin buttons, links, or controls exist in this view.
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
