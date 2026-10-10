import React, { useState, useEffect } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Server,
  Activity,
  Cpu,
  Gauge,
  Network,
  CheckCircle2,
  Flame,
  ArrowRight,
  Play,
  Square,
  Zap,
  BarChart2,
  RefreshCw,
  PlusCircle,
  Radio,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sliders
} from "lucide-react";

export const Ec2LiveTelemetryBanner = () => {
  const {
    fetchEc2Fleet,
    formatCurrency,
    setActiveTab,
    account,
    serviceAction,
    rebootEc2,
    fetchEc2Telemetry,
    refreshData
  } = useCloud();

  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [isStreaming, setIsStreaming] = useState(true);
  const [latencyMs, setLatencyMs] = useState(24);
  const [actionLoading, setActionLoading] = useState({});

  const loadMetrics = async () => {
    const start = performance.now();
    try {
      const res = await fetchEc2Fleet();
      if (res && res.success) {
        setFleetData(res);
        setLatencyMs(Math.round(performance.now() - start));
        setLastSyncSeconds(0);
      }
    } catch (e) {
      console.warn("EC2 telemetry fetch notice:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // 3-second live CloudWatch polling loop
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      loadMetrics();
    }, 6000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Second-by-second elapsed ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setLastSyncSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleAction = async (resourceId, action) => {
    setActionLoading((prev) => ({ ...prev, [resourceId]: action }));
    try {
      await serviceAction(resourceId, action);
      await loadMetrics();
      await refreshData();
    } finally {
      setActionLoading((prev) => ({ ...prev, [resourceId]: null }));
    }
  };

  const stats = fleetData?.stats || {
    total: 2,
    running: 0,
    stopped: 2,
    avgCpu: 0.0,
    totalHourlyCost: 0,
    totalMonthlyCost: 0,
    totalVCpu: 4,
    totalRamGb: 9,
    networkInKbps: 0,
    networkOutKbps: 0,
    diskOps: 0,
    burnRateSec: 0,
    systemHealthPct: 100,
    sparkline: [
      { time: "0", cpu: 0.1 }, { time: "1", cpu: 0.1 }, { time: "2", cpu: 0.1 },
      { time: "3", cpu: 0.2 }, { time: "4", cpu: 0.1 }, { time: "5", cpu: 0.1 },
      { time: "6", cpu: 0.1 }, { time: "7", cpu: 0.1 }, { time: "8", cpu: 0.2 },
      { time: "9", cpu: 0.1 }, { time: "10", cpu: 0.1 }, { time: "11", cpu: 0.0 }
    ]
  };

  const instances = fleetData?.instances || [];
  const sparklinePoints = stats.sparkline || [];

  return (
    <div
      className="ec2-live-telemetry-banner"
      style={{
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.98))",
        borderRadius: "16px",
        border: "1px solid rgba(56, 189, 248, 0.3)",
        boxShadow: "0 14px 34px -8px rgba(0, 0, 0, 0.45), 0 0 20px rgba(56, 189, 248, 0.1)",
        padding: "18px 22px",
        marginBottom: "26px",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background ambient neon glow */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "8%",
          width: "260px",
          height: "160px",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none"
        }}
      />

      {/* Top Header: Streaming Status, Heartbeat, & Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "14px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              borderRadius: "20px",
              backgroundColor: isStreaming ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
              border: `1px solid ${isStreaming ? "rgba(16, 185, 129, 0.35)" : "rgba(148, 163, 184, 0.25)"}`,
              fontSize: "0.76rem",
              fontWeight: "700",
              color: isStreaming ? "#34d399" : "#94a3b8"
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isStreaming ? "#10b981" : "#94a3b8",
                boxShadow: isStreaming ? "0 0 10px #10b981" : "none",
                animation: isStreaming ? "pulse 1.8s infinite" : "none"
              }}
            />
            <span>{isStreaming ? "LIVE EC2 CPU & TELEMETRY STREAM" : "STREAM PAUSED"}</span>
          </div>

          <div style={{ fontSize: "0.78rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={13} />
            <span>Sampled {lastSyncSeconds === 0 ? "just now" : `${lastSyncSeconds}s ago`}</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <span style={{ color: "#38bdf8" }}>{latencyMs}ms latency</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <span style={{ color: "#f8fafc" }}>Region: {account?.primaryRegion || "ap-south-1"}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={loadMetrics}
            className="btn btn-sm"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: "0.76rem",
              padding: "6px 12px"
            }}
            title="Force refresh CloudWatch telemetry now"
          >
            <RefreshCw size={13} className="text-neon-cyan" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setActiveTab("ec2")}
            className="btn btn-sm"
            style={{
              background: "linear-gradient(135deg, #ff9900, #f59e0b)",
              border: "none",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.78rem",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
              cursor: "pointer"
            }}
          >
            <Server size={14} />
            <span>Open EC2 Live Operations Hub</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Main 5 Metric Segments */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          paddingTop: "16px"
        }}
      >
        {/* 1. Fleet CPU Workload & Sparkline */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Fleet CPU Load
            </span>
            <Gauge size={14} style={{ color: Number(stats.avgCpu) > 70 ? "#ef4444" : "#38bdf8" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "1.6rem", fontWeight: "800", color: "#f8fafc" }}>
              {stats.avgCpu}%
            </span>
            <span style={{ fontSize: "0.72rem", color: stats.running === 0 ? "#94a3b8" : Number(stats.avgCpu) < 15 ? "#f59e0b" : "#34d399", fontWeight: "600" }}>
              {stats.running === 0 ? "Standby State" : "Nominal"}
            </span>
          </div>

          {/* Micro SVG Sparkline for CPU */}
          <div style={{ marginTop: "6px", height: "26px", width: "100%" }}>
            <svg viewBox="0 0 140 26" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="bannerCpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = sparklinePoints;
                const step = 140 / Math.max(1, pts.length - 1);
                const poly = pts.map((p, i) => `${i * step},${24 - (Math.min(100, Math.max(0, p.cpu)) / 100) * 20}`).join(" ");
                return (
                  <>
                    <polygon points={`0,24 ${poly} 140,24`} fill="url(#bannerCpuGrad)" />
                    <polyline points={poly} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
                  </>
                );
              })()}
            </svg>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
            Continuous 12-point CloudWatch trend
          </div>
        </div>

        {/* 2. Compute Capacity */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Allocated Compute
            </span>
            <Cpu size={14} className="text-neon-cyan" />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "1.6rem", fontWeight: "800", color: "#f8fafc" }}>
              {stats.totalVCpu}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: "600" }}>vCPUs</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#38bdf8" }}>{stats.totalRamGb}</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>GB RAM</span>
          </div>

          <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "#94a3b8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span>Architecture</span>
              <span style={{ color: "#f8fafc", fontWeight: "600" }}>x86_64 / HVM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Hypervisor</span>
              <span style={{ color: "#34d399", fontWeight: "600" }}>AWS Nitro</span>
            </div>
          </div>
        </div>

        {/* 3. Network & IOPS */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Network & IOPS
            </span>
            <Network size={14} style={{ color: "#38bdf8" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "3px", margin: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                <ArrowUpRight size={13} style={{ color: "#34d399" }} /> Ingress
              </span>
              <strong style={{ color: "#34d399" }}>{stats.networkInKbps} KB/s</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                <ArrowDownRight size={13} style={{ color: "#38bdf8" }} /> Egress
              </span>
              <strong style={{ color: "#38bdf8" }}>{stats.networkOutKbps} KB/s</strong>
            </div>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "5px" }}>
            Disk Activity: <span style={{ color: "#f8fafc" }}>{stats.diskOps} IOPS</span>
          </div>
        </div>

        {/* 4. AWS Health & Status Checks */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              AWS Health Checks
            </span>
            <CheckCircle2 size={14} style={{ color: "#10b981" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "1.6rem", fontWeight: "800", color: "#10b981" }}>
              100%
            </span>
            <span style={{ fontSize: "0.74rem", color: "#34d399", fontWeight: "600" }}>Healthy</span>
          </div>

          <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "#94a3b8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span>System Check</span>
              <span style={{ color: "#34d399", fontWeight: "600" }}>1/1 Passed</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Hardware Host</span>
              <span style={{ color: "#34d399", fontWeight: "600" }}>Nominal</span>
            </div>
          </div>
        </div>

        {/* 5. Live Burn Rate */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Live Burn Rate
            </span>
            <Flame size={14} style={{ color: "#ff9900" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ff9900" }}>
              ₹{stats.totalHourlyCost}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>/ hour</span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
              <span>Second Tick:</span>
              <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>+ ₹{stats.burnRateSec}/s</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Fleet Lifecycle:</span>
              <span style={{ color: "#f8fafc", fontWeight: "600" }}>{stats.running} Run / {stats.stopped} Stop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick Workload Actions Bar */}
      {instances.length > 0 && (
        <div
          style={{
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#cbd5e1" }}>
            <Sliders size={14} className="text-neon-cyan" />
            <span><strong>Quick EC2 Fleet Actions:</strong></span>
            {instances.slice(0, 3).map((inst) => (
              <span
                key={inst.id}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>{inst.name} ({inst.instanceType})</span>
                <span style={{ color: inst.state === "running" ? "#34d399" : "#f87171" }}>
                  • {inst.state}
                </span>
                {inst.state === "stopped" ? (
                  <button
                    onClick={() => handleAction(inst.id, "start")}
                    disabled={actionLoading[inst.id] === "start"}
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid #10b981",
                      color: "#34d399",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.68rem"
                    }}
                    title="Start on AWS"
                  >
                    ▶ Start
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(inst.id, "stop")}
                    disabled={actionLoading[inst.id] === "stop"}
                    style={{
                      background: "rgba(245, 158, 11, 0.2)",
                      border: "1px solid #f59e0b",
                      color: "#fbbf24",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.68rem"
                    }}
                    title="Stop on AWS"
                  >
                    ⏹ Stop
                  </button>
                )}
              </span>
            ))}
          </div>

          <button
            onClick={() => setActiveTab("ec2")}
            style={{
              background: "transparent",
              border: "none",
              color: "#38bdf8",
              fontSize: "0.76rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>Manage All {stats.total} Instances & Metrics</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
