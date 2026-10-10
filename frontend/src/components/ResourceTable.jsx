import React, { useState } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Search,
  Filter,
  Server,
  Database,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Calendar,
  Play,
  Square,
  Trash2,
  PlusCircle,
  Radio,
  Zap,
  ShieldAlert,
  Info
} from "lucide-react";

export const ResourceTable = () => {
  const {
    resources,
    summary,
    formatCurrency,
    setActiveTab,
    isLiveStreaming,
    setIsLiveStreaming,
    setIsEnableModalOpen,
    serviceAction,
    deleteService
  } = useCloud();

  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [actionLoading, setActionLoading] = useState({});

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    const matchesService =
      selectedService === "ALL" || r.type.toUpperCase() === selectedService.toUpperCase();

    const matchesStatus =
      selectedStatus === "ALL" ||
      r.status?.toUpperCase() === selectedStatus.toUpperCase() ||
      r.state?.toUpperCase() === selectedStatus.toUpperCase();

    return matchesSearch && matchesService && matchesStatus;
  });

  const getStatusBadge = (status, state) => {
    if (state === "stopped") {
      return <span className="badge badge-rose" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>Stopped (₹0/hr)</span>;
    }
    if (state === "terminated") {
      return <span className="badge badge-purple" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>Terminated</span>;
    }
    switch (status) {
      case "OPTIMAL":
        return <span className="badge badge-neon-green">Optimal</span>;
      case "OPTIMIZED":
        return <span className="badge badge-neon-green">Optimized</span>;
      case "UNDERUTILIZED":
        return <span className="badge badge-rose">Underutilized</span>;
      case "UNATTACHED":
        return <span className="badge badge-rose">Unattached</span>;
      case "IDLE":
        return <span className="badge badge-neon-amber">Idle Replica</span>;
      default:
        return <span className="badge badge-cream">{status || state}</span>;
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case "EC2": return <Server size={14} className="text-cream" />;
      case "RDS": return <Database size={14} className="text-neon-green" />;
      case "S3": return <HardDrive size={14} className="text-neon-cyan" />;
      case "EBS": return <HardDrive size={14} className="text-neon-amber" />;
      default: return <Cpu size={14} className="text-neon-cyan" />;
    }
  };

  const handleAction = async (resourceId, action) => {
    setActionLoading((prev) => ({ ...prev, [resourceId]: true }));
    try {
      if (action === "delete") {
        if (window.confirm(`Are you sure you want to permanently remove/terminate resource ${resourceId}?`)) {
          await deleteService(resourceId);
        }
      } else {
        await serviceAction(resourceId, action);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [resourceId]: false }));
    }
  };

  return (
    <div className="resources-section glass-card">
      {/* Section Header Row */}
      <div className="section-header-row" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="section-title-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Layers className="text-neon-green" size={24} />
            <h2 className="section-title" style={{ margin: 0 }}>
              Live Monitored AWS Fleet ({resources.length})
            </h2>
            <div
              className={`live-streaming-indicator ${isLiveStreaming ? "active" : "paused"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: "700",
                background: isLiveStreaming ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                color: isLiveStreaming ? "#10b981" : "#94a3b8",
                border: isLiveStreaming ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)"
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isLiveStreaming ? "#10b981" : "#94a3b8",
                  boxShadow: isLiveStreaming ? "0 0 8px #10b981" : "none",
                  animation: isLiveStreaming ? "pulse 1.5s infinite" : "none"
                }}
              />
              <span>{isLiveStreaming ? "LIVE STREAMING (1s Ticker)" : "STREAM PAUSED"}</span>
            </div>
          </div>
          <p className="section-subtitle" style={{ margin: "4px 0 0 0" }}>
            Real-time live telemetry tracking. Costs are computed second-by-second from each resource's exact start date.
          </p>
        </div>

        {/* Action Buttons: Enable AWS Service + Live Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="btn btn-sm"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
              color: "var(--text-main)",
              cursor: "pointer",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "0.82rem"
            }}
            title={isLiveStreaming ? "Pause live streaming ticker" : "Resume live streaming ticker"}
          >
            <Radio size={14} className={isLiveStreaming ? "text-neon-green" : "text-muted"} />
            <span>{isLiveStreaming ? "Pause Stream" : "Resume Stream"}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab("ec2")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderColor: "rgba(255, 153, 0, 0.4)",
              color: "#ff9900"
            }}
            title="Open EC2 Live Operations Hub"
          >
            <Server size={14} />
            <span>EC2 Operations</span>
          </button>

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
              cursor: "pointer",
              borderRadius: "8px",
              padding: "6px 14px",
              fontWeight: "700",
              fontSize: "0.84rem",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)"
            }}
            title="Enable an AWS service on a specific date to track live"
          >
            <PlusCircle size={16} />
            <span>+ Enable AWS Service</span>
          </button>
        </div>
      </div>

      {/* FinOps Live Tracking Explanatory Banner */}
      <div
        style={{
          margin: "1rem 0",
          padding: "0.85rem 1.25rem",
          borderRadius: "12px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.06))",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Clock className="text-neon-green" size={20} />
          <div>
            <span style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-main)" }}>
              Accurate Start-Date Telemetry Tracking
            </span>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Charges are strictly pro-rated from the exact hour/minute each service was enabled. Zero Day-1 monthly assumptions.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Live Incurred Spend (To-Date)
            </span>
            <div style={{ fontWeight: "800", fontSize: "1.1rem", color: "var(--accent-neon-green, #10b981)", fontFamily: "monospace" }}>
              {formatCurrency(summary?.incurredSpendToDate || 0, true)}
            </div>
          </div>

          <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.15)" }} />

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Projected Full Month
            </span>
            <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-main)", fontFamily: "monospace" }}>
              {formatCurrency(summary?.monthlyCost || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls-row">
        <div className="search-input-wrapper glass-panel">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search by instance name or ID (e.g. prod-payment, i-0f81)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Service Filters */}
        <div className="filter-group">
          <span className="filter-label">Service:</span>
          {["ALL", "EC2", "RDS", "S3", "EBS"].map((srv) => (
            <button
              key={srv}
              className={`filter-chip ${selectedService === srv ? "active" : ""}`}
              onClick={() => setSelectedService(srv)}
            >
              {srv}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="filter-group">
          <span className="filter-label">State:</span>
          {["ALL", "OPTIMAL", "UNDERUTILIZED", "STOPPED"].map((st) => (
            <button
              key={st}
              className={`filter-chip ${selectedStatus === st ? "active" : ""}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Resource Name & ID</th>
              <th>Service</th>
              <th>Spec / Tier</th>
              <th>Service Start Date (Tracked)</th>
              <th>Live Active Uptime</th>
              <th>Hourly Rate</th>
              <th>Incurred Spend (To-Date)</th>
              <th>CPU / Utilization</th>
              <th>Status</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center text-secondary" style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
                  <div style={{ fontWeight: "600", color: "var(--text-main)", marginBottom: "6px" }}>
                    {resources.length === 0 ? "No Active Cloud Resources Tracked" : "No cloud resources matching current filters."}
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                    Click <strong>"+ Enable AWS Service"</strong> above to launch and live-track any EC2, S3, RDS, or EBS service from a specific date.
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsEnableModalOpen(true)}
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}
                  >
                    + Enable AWS Service Now
                  </button>
                </td>
              </tr>
            ) : (
              filteredResources.map((res) => {
                const cpu = res.cpuUtilization;
                const isStopped = res.state === "stopped";
                const isTerminated = res.state === "terminated";
                const isLoading = actionLoading[res.id];

                return (
                  <tr key={res.id} style={{ opacity: isTerminated ? 0.5 : 1 }}>
                    {/* Name & ID */}
                    <td>
                      <div className="resource-name-cell">
                        <span className="font-semibold text-white">{res.name}</span>
                        <span className="text-muted text-xs font-mono">{res.id}</span>
                        {res.awsProvisioned && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#10b981",
                              fontWeight: "600",
                              width: "fit-content",
                              marginTop: "2px"
                            }}
                          >
                            ✓ Real AWS Console
                          </span>
                        )}
                        {res.awsError && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#f59e0b",
                              fontWeight: "600",
                              width: "fit-content",
                              marginTop: "2px"
                            }}
                            title={res.awsError}
                          >
                            IAM Policy Needed for AWS Console
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Service */}
                    <td>
                      <div className="service-tag">
                        {getServiceIcon(res.type)}
                        <span>{res.type}</span>
                      </div>
                    </td>

                    {/* Spec / Tier */}
                    <td>
                      <span className="font-mono text-xs text-cream">
                        {res.instanceType || res.volumeType || res.storageClass || "Standard"}
                      </span>
                    </td>

                    {/* START DATE & TIMESTAMP (KEY REQUIREMENT) */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} className="text-neon-green" />
                          <span style={{ fontWeight: "600", fontSize: "0.82rem", color: "var(--text-main)" }}>
                            {res.startedAtFormatted ? res.startedAtFormatted.split(",")[0] : "Live"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {res.startedAtTime || "00:00:00"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            padding: "1px 6px",
                            borderRadius: "6px",
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#10b981",
                            width: "fit-content",
                            marginTop: "2px"
                          }}
                          title={res.calculationBasis || "Live calculated from service start date"}
                        >
                          Exact Start Date
                        </span>
                      </div>
                    </td>

                    {/* LIVE ACTIVE UPTIME (STREAMING TICKER) */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {!isStopped && !isTerminated && (
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: "#10b981",
                              boxShadow: "0 0 6px #10b981"
                            }}
                          />
                        )}
                        <span style={{ fontWeight: "700", fontFamily: "monospace", fontSize: "0.84rem", color: isStopped ? "#94a3b8" : "#ffffff" }}>
                          {res.uptimeFormatted || "0s"}
                        </span>
                      </div>
                      {isStopped && (
                        <span style={{ fontSize: "0.7rem", color: "#f87171" }}>Paused</span>
                      )}
                    </td>

                    {/* HOURLY RATE */}
                    <td>
                      <span className="font-mono text-xs text-secondary">
                        {formatCurrency(res.hourlyRate || (res.costPerMonth ? res.costPerMonth / 730 : 0), true)}/hr
                      </span>
                    </td>

                    {/* INCURRED SPEND TO-DATE (CALCULATED FROM START DATE) */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: "800",
                            fontFamily: "monospace",
                            fontSize: "0.92rem",
                            color: isStopped ? "var(--text-muted)" : "var(--accent-neon-green, #10b981)"
                          }}
                        >
                          {formatCurrency(res.incurredCost || 0, true)}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {res.projectedMonthCost ? `(Proj: ${formatCurrency(res.projectedMonthCost)})` : "Live tracked"}
                        </span>
                      </div>
                    </td>

                    {/* CPU Utilization */}
                    <td>
                      {cpu !== undefined ? (
                        <div className="cpu-cell">
                          <div className="cpu-bar-bg">
                            <div
                              className={`cpu-bar-fill ${
                                cpu < 10 ? "fill-rose" : cpu < 40 ? "fill-amber" : "fill-emerald"
                              }`}
                              style={{ width: `${Math.min(100, cpu)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono ${cpu < 10 ? "text-rose font-bold" : "text-white"}`}>
                            {cpu}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>{getStatusBadge(res.status, res.state)}</td>

                    {/* Operations / Actions */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {/* Stop / Start button for compute */}
                        {res.type === "EC2" && (
                          <button
                            className="btn-icon-xs"
                            onClick={() => handleAction(res.id, isStopped ? "start" : "stop")}
                            disabled={isLoading}
                            title={isStopped ? "Start Instance (Resume billing)" : "Stop Instance (Halt compute charges)"}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                              background: isStopped ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)",
                              color: isStopped ? "#10b981" : "#f87171",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: "600"
                            }}
                          >
                            {isStopped ? <Play size={11} /> : <Square size={11} />}
                            <span>{isStopped ? "Start" : "Stop"}</span>
                          </button>
                        )}

                        {/* Rightsize button for underutilized */}
                        {(res.status === "UNDERUTILIZED" || res.status === "UNATTACHED") && !isStopped && (
                          <button
                            className="btn btn-neon-green btn-xs"
                            onClick={() => setActiveTab("recommendations")}
                            title="View Rightsizing Plan"
                            style={{ padding: "3px 8px" }}
                          >
                            <span>Rightsize</span>
                            <ArrowRight size={11} />
                          </button>
                        )}

                        {/* Manage button for S3 */}
                        {res.type === "S3" && (
                          <button
                            className="btn btn-xs"
                            onClick={() => setActiveTab("s3")}
                            title="Manage S3 Bucket in Storage Operations Hub"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#10b981",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: "600"
                            }}
                          >
                            <Database size={11} />
                            <span>Manage</span>
                          </button>
                        )}

                        {/* Delete / Terminate */}
                        <button
                          className="btn-icon-xs"
                          onClick={() => handleAction(res.id, "delete")}
                          disabled={isLoading}
                          title="Permanently remove / terminate tracked resource"
                          style={{
                            padding: "4px",
                            borderRadius: "6px",
                            border: "none",
                            background: "transparent",
                            color: "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
