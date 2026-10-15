import React, { useState } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  TrendingDown,
  Layers,
  X,
  Loader2,
  ShieldCheck,
  Server,
  RefreshCw,
  Archive,
  AlertTriangle,
  Play,
  Square,
  Activity,
  Cpu,
  Gauge,
  ArrowRight,
  Sliders,
  BarChart2,
  Flame,
  Radio,
  ExternalLink,
  Database
} from "lucide-react";

export const RecommendationsList = () => {
  const {
    recommendations,
    applyOptimization,
    dismissRecommendation,
    formatCurrency,
    refreshData,
    mode,
    resources,
    setActiveTab,
    serviceAction,
    rebootEc2,
    resizeEc2,
    fetchEc2Telemetry
  } = useCloud();

  const [activeFilter, setActiveFilter] = useState("pending"); // "pending" | "closed"
  const [processingId, setProcessingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [confirmingRec, setConfirmingRec] = useState(null);

  // Deep Telemetry inspection modal state
  const [telemetryInstance, setTelemetryInstance] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Resize modal state
  const [resizeTarget, setResizeTarget] = useState(null);
  const [newResizeType, setNewResizeType] = useState("t3.micro");
  const [isResizing, setIsResizing] = useState(false);

  // Action loading for start/stop/reboot on specific resources
  const [inlineActionLoading, setInlineActionLoading] = useState({});

  // Compute fleet telemetry stats for the top banner
  const ec2Resources = (resources || []).filter((r) => r.type === "EC2");
  const runningCount = ec2Resources.filter((r) => r.state === "running").length;
  const stoppedCount = ec2Resources.filter((r) => r.state === "stopped").length;
  const avgCpu = ec2Resources.length > 0 && runningCount > 0
    ? (ec2Resources.reduce((acc, r) => acc + (r.state === "running" ? (r.cpuUtilization || 0) : 0), 0) / runningCount).toFixed(1)
    : "0.0";
  const totalVCpu = ec2Resources.reduce((acc, r) => acc + (r.vCpu || 2), 0);
  const totalRamGb = ec2Resources.reduce((acc, r) => acc + (r.instanceType?.includes("large") ? 8 : r.instanceType?.includes("medium") ? 4 : 1), 0);

  const getServiceBadgeClass = (service) => {
    switch (service) {
      case "EC2": return "badge-cream";
      case "RDS": return "badge-neon-green";
      case "EBS": return "badge-neon-amber";
      case "S3": return "badge-neon-cyan";
      default: return "badge-cream";
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "HIGH":
      case "CRITICAL":
        return <span className="badge badge-rose">High Severity</span>;
      case "MEDIUM":
        return <span className="badge badge-neon-amber">Medium Severity</span>;
      default:
        return <span className="badge badge-cream">Low Severity</span>;
    }
  };

  const handleActionClick = (rec) => {
    const isDestructive =
      rec.type?.includes("TERMINATE") ||
      rec.type?.includes("DELETE") ||
      rec.actionLabel?.toLowerCase().includes("terminate") ||
      rec.actionLabel?.toLowerCase().includes("delete");

    if (isDestructive) {
      setConfirmingRec(rec);
    } else {
      executeApply(rec.id);
    }
  };

  const executeApply = async (recId) => {
    setProcessingId(recId);
    try {
      const result = await applyOptimization(recId);
      if (result?.success) {
        setClosingId(recId);
        setTimeout(() => {
          setClosingId(null);
        }, 800);
      }
    } finally {
      setProcessingId(null);
      setConfirmingRec(null);
    }
  };

  const handleDismiss = async (recId) => {
    setClosingId(recId);
    setTimeout(async () => {
      await dismissRecommendation(recId);
      setClosingId(null);
    }, 400);
  };

  // One-click Start / Stop from the recommendation card
  const handleInlineAction = async (resourceId, action) => {
    setInlineActionLoading((prev) => ({ ...prev, [resourceId]: action }));
    try {
      await serviceAction(resourceId, action);
      await refreshData();
    } finally {
      setInlineActionLoading((prev) => ({ ...prev, [resourceId]: null }));
    }
  };

  // Open Deep Telemetry Modal
  const handleOpenTelemetry = async (resourceId, resourceName) => {
    const inst = ec2Resources.find((r) => r.id === resourceId) || {
      id: resourceId,
      name: resourceName || resourceId,
      cpuUtilization: 0.0,
      state: "stopped",
      region: "ap-south-1"
    };
    setTelemetryInstance(inst);
    setLoadingTelemetry(true);
    setTelemetryData(null);
    try {
      const res = await fetchEc2Telemetry(resourceId);
      if (res && res.success) {
        setTelemetryData(res.data);
      }
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Open Resize Modal
  const handleOpenResizeModal = (rec) => {
    const currentInst = ec2Resources.find((r) => r.id === rec.resourceId) || {
      id: rec.resourceId,
      name: rec.resourceName,
      instanceType: rec.currentSpec?.split(" ")[0] || "t3.micro"
    };
    setResizeTarget(currentInst);
    setNewResizeType(rec.targetInstanceType || "t3.micro");
  };

  const handleResizeSubmit = async (e) => {
    e.preventDefault();
    if (!resizeTarget) return;
    setIsResizing(true);
    try {
      await resizeEc2(resizeTarget.id, newResizeType);
      setResizeTarget(null);
      await refreshData();
    } finally {
      setIsResizing(false);
    }
  };

  const pendingRecs = recommendations.filter((r) => !r.applied && !r.closed);
  const closedRecs = recommendations.filter((r) => r.applied || r.closed);
  const displayedRecs = activeFilter === "pending" ? pendingRecs : closedRecs;

  const instanceTypeSpecs = {
    "t2.nano": { vCpu: 1, ram: "0.5 GB", inr: 460 },
    "t3.nano": { vCpu: 2, ram: "0.5 GB", inr: 440 },
    "t2.micro": { vCpu: 1, ram: "1 GB", inr: 920 },
    "t3.micro": { vCpu: 2, ram: "1 GB", inr: 880 },
    "t2.small": { vCpu: 1, ram: "2 GB", inr: 1840 },
    "t3.small": { vCpu: 2, ram: "2 GB", inr: 1760 },
    "t2.medium": { vCpu: 2, ram: "4 GB", inr: 3680 },
    "t3.medium": { vCpu: 2, ram: "4 GB", inr: 3520 },
    "t2.large": { vCpu: 2, ram: "8 GB", inr: 6400 },
    "t4g.nano": { vCpu: 2, ram: "0.5 GB", inr: 380 },
    "t4g.micro": { vCpu: 2, ram: "1 GB", inr: 750 },
    "t4g.small": { vCpu: 2, ram: "2 GB", inr: 1500 }
  };

  return (
    <div className="recommendations-container">

      {/* ============================================================== */}
      {/* 🚀 TOP FLEET TELEMETRY & CPU WORKLOAD RIBBON                    */}
      {/* ============================================================== */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))",
          borderRadius: "14px",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow: "0 12px 30px -8px rgba(0, 0, 0, 0.4)",
          padding: "16px 20px",
          marginBottom: "24px",
          color: "#ffffff"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8"
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", margin: 0, color: "#f8fafc" }}>
                  Live EC2 Fleet Telemetry & Workload Overview
                </h3>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.3)"
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.8s infinite" }} />
                  Live AWS Synced
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
                Continuous CloudWatch sampling across ap-south-1 • Real hardware specs & rightsizing potential
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("ec2")}
              className="btn btn-sm"
              style={{
                background: "linear-gradient(135deg, #ff9900, #f59e0b)",
                border: "none",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "0.8rem",
                padding: "7px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                cursor: "pointer"
              }}
            >
              <Server size={15} />
              <span>EC2 Operations</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setActiveTab("s3")}
              className="btn btn-sm"
              style={{
                background: "linear-gradient(135deg, #059669, #0d9488)",
                border: "none",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "0.8rem",
                padding: "7px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                cursor: "pointer"
              }}
            >
              <Database size={15} />
              <span>S3 Storage Operations</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {/* 1. Fleet CPU Utilization */}
          <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
              <span>Fleet CPU Load</span>
              <Gauge size={14} style={{ color: Number(avgCpu) > 70 ? "#ef4444" : "#38bdf8" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "4px 0" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f8fafc" }}>{avgCpu}%</span>
              <span style={{ fontSize: "0.72rem", color: runningCount === 0 ? "#94a3b8" : Number(avgCpu) < 15 ? "#f59e0b" : "#34d399", fontWeight: "600" }}>
                {runningCount === 0 ? "Fleet Standby" : Number(avgCpu) < 15 ? "Low Utilization" : "Active Load"}
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(5, Number(avgCpu)))}%`,
                  height: "100%",
                  background: Number(avgCpu) > 70 ? "#ef4444" : Number(avgCpu) < 15 ? "#f59e0b" : "#34d399",
                  transition: "width 0.4s ease"
                }}
              />
            </div>
          </div>

          {/* 2. Compute Allocation */}
          <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
              <span>Total Compute</span>
              <Cpu size={14} style={{ color: "#34d399" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "4px 0" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f8fafc" }}>{totalVCpu}</span>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>vCPUs</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#38bdf8" }}>{totalRamGb}</span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>GB RAM</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
              Architecture: x86_64 / AWS Nitro
            </div>
          </div>

          {/* 3. Fleet Lifecycle Distribution */}
          <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
              <span>Fleet Lifecycle</span>
              <Server size={14} style={{ color: "#f59e0b" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#34d399" }}>{runningCount} Running</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f87171" }}>{stoppedCount} Stopped</span>
              </div>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
              Ready to power on or downsize
            </div>
          </div>

          {/* 4. Action Playbook Summary */}
          <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
              <span>What You Can Do</span>
              <Zap size={14} style={{ color: "#ff9900" }} />
            </div>
            <div style={{ fontSize: "0.74rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.4" }}>
              • <strong>Start:</strong> Boot stopped instance to stream live CPU<br />
              • <strong>Rightsize:</strong> Downsize heavy instances (e.g. t2.large → t3.micro)<br />
              • <strong>Decommission:</strong> Terminate to stop persistent EBS fees
            </div>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal for Terminate / Delete */}
      {confirmingRec && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
              <div style={{ padding: "10px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                  Confirm Permanent Termination on AWS
                </h3>
                <span className="badge badge-rose" style={{ marginTop: "4px" }}>Irreversible Action</span>
              </div>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "1rem" }}>
              You are about to execute <strong>{confirmingRec.title}</strong> directly on your live AWS account.
            </p>

            <div className="glass-panel" style={{ padding: "0.85rem", borderRadius: "8px", marginBottom: "1.25rem", borderLeft: "3px solid #ef4444" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Target AWS Resource:</div>
              <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.95rem" }}>
                {confirmingRec.resourceName} ({confirmingRec.resourceId})
              </div>
              <div style={{ fontSize: "0.85rem", color: "#10b981", marginTop: "6px", fontWeight: "600" }}>
                Monthly Spend Eliminated: {formatCurrency(confirmingRec.monthlySavings)}/mo
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmingRec(null)}
                disabled={processingId === confirmingRec.id}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
                disabled={processingId === confirmingRec.id}
                onClick={() => executeApply(confirmingRec.id)}
              >
                {processingId === confirmingRec.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Terminating on AWS...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirm Terminate on AWS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="section-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="section-title-group">
            <Sparkles className="text-neon-amber" size={24} />
            <h2 className="section-title">AI-Powered Optimization Recommendations</h2>
          </div>
          <p className="section-subtitle">
            Heuristic rules & machine learning diagnostics flagging cloud waste and automated 1-click AWS remediation.
          </p>
        </div>

        {/* Filter Tabs & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="glass-panel" style={{ display: "flex", padding: "3px", borderRadius: "8px" }}>
            <button
              className={`btn btn-sm ${activeFilter === "pending" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              onClick={() => setActiveFilter("pending")}
            >
              Action Pending ({pendingRecs.length})
            </button>
            <button
              className={`btn btn-sm ${activeFilter === "closed" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              onClick={() => setActiveFilter("closed")}
            >
              <Archive size={13} style={{ marginRight: "4px" }} />
              Remediated & Closed ({closedRecs.length})
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={refreshData}
            title="Re-scan live AWS fleet"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            <RefreshCw size={13} />
            <span>Re-Scan</span>
          </button>
        </div>
      </div>

      {displayedRecs.length === 0 ? (
        <div className="glass-card" style={{ padding: "3.5rem 2rem", textAlign: "center", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "inline-flex", padding: "1.2rem", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", marginBottom: "1rem" }}>
            <CheckCircle2 size={40} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {activeFilter === "pending"
              ? "All Cloud Recommendations Remediated & Closed on AWS!"
              : "No Remediated Recommendations in History"}
          </h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", fontSize: "0.9rem", lineHeight: "1.6" }}>
            {activeFilter === "pending"
              ? "Your live AWS infrastructure has zero pending cost optimizations. All waste has been adjusted, and your active fleet is running at maximum FinOps efficiency."
              : "When you execute direct adjustments on AWS, closed recommendations will be cataloged here with timestamped audit trails."}
          </p>

          {activeFilter === "pending" && closedRecs.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveFilter("closed")}>
                <Archive size={14} style={{ marginRight: "6px" }} />
                View {closedRecs.length} Remediated Action{closedRecs.length > 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="recommendations-grid">
          {displayedRecs.map((rec) => {
            const isApplied = rec.applied || rec.closed;
            const isProcessing = processingId === rec.id;
            const isClosing = closingId === rec.id;
            const isTerminateAction =
              rec.type?.includes("TERMINATE") ||
              rec.type?.includes("DELETE") ||
              rec.actionLabel?.toLowerCase().includes("terminate") ||
              rec.actionLabel?.toLowerCase().includes("delete");

            // Look up corresponding real resource in fleet for live controls
            const matchedResource = (resources || []).find((r) => r.id === rec.resourceId || r.name === rec.resourceName);
            const isInstanceStopped = matchedResource ? matchedResource.state === "stopped" : rec.state === "stopped";
            const cpuVal = typeof rec.cpuUtilization === "number" ? rec.cpuUtilization : (matchedResource?.cpuUtilization || 0);

            return (
              <div
                key={rec.id}
                className={`glass-card rec-card ${isApplied ? "rec-card-applied" : ""} ${isClosing ? "rec-card-closing" : ""}`}
                style={{
                  transition: "all 0.35s ease",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  {/* Header Row */}
                  <div className="rec-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="rec-badges-row">
                      <span className={`badge ${getServiceBadgeClass(rec.service)}`}>
                        {rec.service}
                      </span>
                      {getSeverityBadge(rec.severity)}
                      <span className="badge badge-purple">{rec.type}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isApplied ? (
                        <span className="badge badge-neon-green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} /> Remediated on AWS
                        </span>
                      ) : (
                        <span className={`badge ${isTerminateAction ? "badge-rose" : "badge-neon-amber"}`}>
                          {isTerminateAction ? "Auto-Terminate" : "Direct AWS Action"}
                        </span>
                      )}

                      {/* Close / Dismiss Cross Button */}
                      {!isApplied && (
                        <button
                          className="rec-dismiss-btn"
                          onClick={() => handleDismiss(rec.id)}
                          title="Close this recommendation"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="rec-title" style={{ marginTop: "0.75rem", fontSize: "1.1rem" }}>{rec.title}</h3>
                  <p className="rec-resource-target" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                    Target: <strong>{rec.resourceName}</strong> ({rec.resourceId})
                  </p>

                  {/* CPU UTILIZATION & HARDWARE SPECS TELEMETRY BAR */}
                  <div
                    style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Gauge size={15} style={{ color: cpuVal > 70 ? "#ef4444" : "#38bdf8" }} />
                      <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                        Observed CPU: <strong style={{ color: cpuVal > 70 ? "#ef4444" : "#f8fafc" }}>{cpuVal}%</strong>
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          backgroundColor: isInstanceStopped ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: isInstanceStopped ? "#f87171" : "#34d399",
                          fontWeight: "600"
                        }}
                      >
                        {isInstanceStopped ? "Stopped" : "Running"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#94a3b8" }}>
                      <Cpu size={13} />
                      <span>{rec.vCpu || 2} vCPU • {rec.memoryGb || 1} GB RAM</span>
                    </div>
                  </div>

                  {/* Specs Before and After */}
                  <div className="rec-specs-box glass-panel" style={{ padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
                    <div className="spec-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="spec-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Current Configuration:</span>
                      <span className="spec-value text-rose" style={{ fontSize: "0.8rem", fontWeight: "600" }}>{rec.currentSpec}</span>
                    </div>
                    <div className="spec-row" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="spec-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>AI Recommended Action:</span>
                      <span className="spec-value text-neon-green" style={{ fontSize: "0.8rem", fontWeight: "600" }}>{rec.recommendedSpec}</span>
                    </div>
                  </div>

                  {/* Metrics Summary */}
                  <p className="rec-metrics-text" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4", marginBottom: "0.75rem" }}>
                    {rec.metricsSummary}
                  </p>

                  {/* AWS Execution Details (if applied) */}
                  {rec.awsExecution && (
                    <div className="glass-panel" style={{ padding: "0.6rem 0.8rem", borderRadius: "6px", marginBottom: "0.75rem", borderLeft: "3px solid #10b981", fontSize: "0.8rem", color: "#10b981" }}>
                      <strong>AWS Confirmation:</strong> {rec.awsExecution.details}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* 🎮 "WHAT YOU CAN DO" MULTI-ACTION OPERATIONS PALETTE            */}
                  {/* ============================================================== */}
                  {!isApplied && rec.service === "EC2" && (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px dashed rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        marginBottom: "12px"
                      }}
                    >
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Sliders size={12} className="text-neon-cyan" />
                        <span>What You Can Do With This Instance:</span>
                      </div>

                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {/* 1. Start / Boot Instance on AWS */}
                        {isInstanceStopped && (
                          <button
                            onClick={() => handleInlineAction(rec.resourceId, "start")}
                            disabled={inlineActionLoading[rec.resourceId] === "start"}
                            style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              color: "#34d399",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "0.72rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Start this EC2 instance on AWS and begin live telemetry"
                          >
                            {inlineActionLoading[rec.resourceId] === "start" ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Play size={12} />
                            )}
                            <span>Start on AWS</span>
                          </button>
                        )}

                        {/* 2. Stop Instance (if running) */}
                        {!isInstanceStopped && (
                          <button
                            onClick={() => handleInlineAction(rec.resourceId, "stop")}
                            disabled={inlineActionLoading[rec.resourceId] === "stop"}
                            style={{
                              background: "rgba(245, 158, 11, 0.15)",
                              border: "1px solid rgba(245, 158, 11, 0.35)",
                              color: "#fbbf24",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "0.72rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Stop instance on AWS to halt compute charges"
                          >
                            {inlineActionLoading[rec.resourceId] === "stop" ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Square size={12} />
                            )}
                            <span>Stop on AWS</span>
                          </button>
                        )}

                        {/* 3. Resize / Rightsize Target Type Modal */}
                        <button
                          onClick={() => handleOpenResizeModal(rec)}
                          style={{
                            background: "rgba(56, 189, 248, 0.15)",
                            border: "1px solid rgba(56, 189, 248, 0.35)",
                            color: "#38bdf8",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Resize instance type to downsize hardware specs & cost"
                        >
                          <Zap size={12} />
                          <span>Rightsize / Resize</span>
                        </button>

                        {/* 4. Live CloudWatch Telemetry Inspection */}
                        <button
                          onClick={() => handleOpenTelemetry(rec.resourceId, rec.resourceName)}
                          style={{
                            background: "rgba(168, 85, 247, 0.15)",
                            border: "1px solid rgba(168, 85, 247, 0.35)",
                            color: "#c084fc",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Open 12-hour continuous CloudWatch CPU chart"
                        >
                          <BarChart2 size={12} />
                          <span>CPU Telemetry</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cost & Savings Summary & Primary Action Button */}
                <div className="rec-footer-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem", marginTop: "8px" }}>
                  <div className="savings-highlight">
                    <span className="savings-label" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Monthly Savings:</span>
                    <span className="savings-amount text-neon-green font-bold" style={{ fontSize: "1.1rem" }}>
                      {formatCurrency(rec.monthlySavings)}/mo
                    </span>
                  </div>

                  <div>
                    {isApplied ? (
                      <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.8 }}>
                        <CheckCircle2 size={14} className="text-neon-green" style={{ marginRight: "4px" }} />
                        <span>Closed on AWS</span>
                      </button>
                    ) : (
                      <button
                        className={`btn btn-sm ${isTerminateAction ? "btn-danger" : "btn-neon-green"}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: "600",
                          backgroundColor: isTerminateAction ? "#dc2626" : undefined,
                          color: isTerminateAction ? "#ffffff" : undefined
                        }}
                        disabled={isProcessing}
                        onClick={() => handleActionClick(rec)}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Adjusting on AWS...</span>
                          </>
                        ) : (
                          <>
                            {isTerminateAction ? <Trash2 size={14} /> : <Zap size={14} />}
                            <span>{rec.actionLabel || "Direct Adjust on AWS"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 📊 DEEP CLOUDWATCH CPU TELEMETRY MODAL                          */}
      {/* ============================================================== */}
      {telemetryInstance && (
        <div className="modal-backdrop" onClick={() => setTelemetryInstance(null)}>
          <div
            className="modal-card white-box-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px", width: "92%" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Activity size={22} className="text-neon-cyan" />
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                    {telemetryInstance.name} — Live CloudWatch Telemetry
                  </h2>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Instance ID: {telemetryInstance.id} • Region: {telemetryInstance.region || "ap-south-1"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setTelemetryInstance(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingTelemetry ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <RefreshCw size={28} className="animate-spin text-neon-cyan" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Querying AWS CloudWatch metrics & system status...</p>
              </div>
            ) : telemetryData ? (
              <div>
                {/* Status Checks Pill Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Status Checks</span>
                    <strong style={{ color: "#10b981", fontSize: "0.88rem" }}>{telemetryData.checksPassed}</strong>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Network In / Out</span>
                    <strong style={{ color: "var(--text-main)", fontSize: "0.88rem" }}>{telemetryData.networkInKbps} / {telemetryData.networkOutKbps} KB/s</strong>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Disk I/O Ops</span>
                    <strong style={{ color: "var(--text-main)", fontSize: "0.88rem" }}>{telemetryData.diskReadOps} R / {telemetryData.diskWriteOps} W</strong>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Hourly Rate</span>
                    <strong style={{ color: "var(--text-main)", fontSize: "0.88rem" }}>₹{telemetryData.hourlyRate}/hr</strong>
                  </div>
                </div>

                {/* SVG CPU Time-Series Chart */}
                <div style={{ marginBottom: "20px", background: "var(--bg-subtle, #121212)", border: "1px solid var(--border-subtle, #262626)", padding: "16px", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f8fafc" }}>
                      CPU Utilization History (Past 12 Hours)
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "600" }}>
                      Current: {telemetryInstance.cpuUtilization}%
                    </span>
                  </div>

                  <svg viewBox="0 0 600 160" style={{ width: "100%", height: "140px", overflow: "visible" }}>
                    <defs>
                      <linearGradient id="cpuGradientRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((val) => {
                      const y = 140 - (val / 100) * 120;
                      return (
                        <g key={val}>
                          <line x1="40" y1={y} x2="590" y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                          <text x="30" y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">{val}%</text>
                        </g>
                      );
                    })}

                    {/* Chart Area and Line */}
                    {telemetryData.cpuHistory && telemetryData.cpuHistory.length > 0 && (() => {
                      const pts = telemetryData.cpuHistory;
                      const step = 550 / Math.max(1, pts.length - 1);
                      const polyPoints = pts.map((p, idx) => {
                        const x = 40 + idx * step;
                        const y = 140 - (Math.min(100, p.cpu) / 100) * 120;
                        return `${x},${y}`;
                      }).join(" ");

                      const areaPoints = `40,140 ${polyPoints} 590,140`;

                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#cpuGradientRec)" />
                          <polyline points={polyPoints} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                          {pts.map((p, idx) => {
                            const x = 40 + idx * step;
                            const y = 140 - (Math.min(100, p.cpu) / 100) * 120;
                            return (
                              <circle key={idx} cx={x} cy={y} r="3" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "40px", marginTop: "8px", fontSize: "0.7rem", color: "#64748b" }}>
                    <span>12h ago</span>
                    <span>6h ago</span>
                    <span>Now</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button className="btn btn-secondary" onClick={() => setTelemetryInstance(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚡ DIRECT RESIZE / RIGHTSIZE INSTANCE MODAL                     */}
      {/* ============================================================== */}
      {resizeTarget && (
        <div className="modal-backdrop" onClick={() => setResizeTarget(null)}>
          <div className="modal-card white-box-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Zap size={22} className="text-neon-cyan" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                  Rightsize / Resize Instance on AWS
                </h3>
              </div>
              <button onClick={() => setResizeTarget(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResizeSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Target Instance
                </label>
                <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}>
                  {resizeTarget.name} ({resizeTarget.id}) — Current: <code>{resizeTarget.instanceType}</code>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Select Optimized Target Instance Type
                </label>
                <select
                  value={newResizeType}
                  onChange={(e) => setNewResizeType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem"
                  }}
                >
                  <optgroup label="Burstable General Purpose (x86_64)">
                    <option value="t3.nano">t3.nano — 2 vCPU, 0.5 GB RAM (₹440/mo)</option>
                    <option value="t3.micro">t3.micro — 2 vCPU, 1 GB RAM (₹880/mo) [Recommended]</option>
                    <option value="t3.small">t3.small — 2 vCPU, 2 GB RAM (₹1,760/mo)</option>
                    <option value="t3.medium">t3.medium — 2 vCPU, 4 GB RAM (₹3,520/mo)</option>
                  </optgroup>
                  <optgroup label="AWS Graviton2 ARM (20% Cheaper)">
                    <option value="t4g.nano">t4g.nano — 2 vCPU, 0.5 GB RAM (₹380/mo)</option>
                    <option value="t4g.micro">t4g.micro — 2 vCPU, 1 GB RAM (₹750/mo)</option>
                    <option value="t4g.small">t4g.small — 2 vCPU, 2 GB RAM (₹1,500/mo)</option>
                  </optgroup>
                </select>
              </div>

              {/* Hardware Preview Comparison */}
              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", marginBottom: "18px", fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Target Hardware:</span>
                  <strong>{instanceTypeSpecs[newResizeType]?.vCpu || 2} vCPU / {instanceTypeSpecs[newResizeType]?.ram || "1 GB"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>New Monthly Run Rate:</span>
                  <strong style={{ color: "#10b981" }}>₹{instanceTypeSpecs[newResizeType]?.inr || 880}/month</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResizeTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isResizing}>
                  {isResizing ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  <span>{isResizing ? "Resizing on AWS..." : "Confirm Resize on AWS"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
