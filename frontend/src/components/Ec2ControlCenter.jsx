import React, { useState, useEffect, useRef } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Server,
  Play,
  Square,
  RotateCw,
  Trash2,
  Cpu,
  Activity,
  Layers,
  Search,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Sliders,
  TrendingDown,
  Clock,
  Radio,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  HardDrive,
  Network,
  Gauge,
  ChevronDown,
  ChevronUp,
  Terminal,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  SlidersHorizontal,
  Flame
} from "lucide-react";

export const Ec2ControlCenter = () => {
  const {
    resources,
    formatCurrency,
    serviceAction,
    rebootEc2,
    resizeEc2,
    launchEc2,
    fetchEc2Telemetry,
    fetchEc2Fleet,
    mode,
    account,
    setIsConnectModalOpen,
    refreshData,
    currency
  } = useCloud();

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [actionLoading, setActionLoading] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Live Stream & Telemetry Bar State
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [latencyMs, setLatencyMs] = useState(26);
  const [isStreamDrawerOpen, setIsStreamDrawerOpen] = useState(false);
  const [fleetStats, setFleetStats] = useState(null);
  const [liveEventLog, setLiveEventLog] = useState([]);
  const [incurredLiveTick, setIncurredLiveTick] = useState(0);

  // Quick Launch Modal State
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [launchName, setLaunchName] = useState("");
  const [launchType, setLaunchType] = useState("t3.micro");
  const [launchRegion, setLaunchRegion] = useState("ap-south-1");
  const [isLaunching, setIsLaunching] = useState(false);

  // Resize Modal State
  const [resizeTarget, setResizeTarget] = useState(null);
  const [newType, setNewType] = useState("t3.micro");
  const [isResizing, setIsResizing] = useState(false);

  // Live Telemetry Modal State
  const [telemetryInstance, setTelemetryInstance] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Extract EC2 instances from the live resources fleet
  const ec2Instances = resources.filter((r) => r.type === "EC2");

  // Fetch Fleet stats & deep telemetry periodically
  const loadFleetMetrics = async () => {
    const t0 = Date.now();
    try {
      const res = await fetchEc2Fleet();
      const elapsed = Date.now() - t0;
      setLatencyMs(elapsed > 0 ? elapsed : 24);
      if (res && res.success && res.stats) {
        setFleetStats(res.stats);
        setLastSyncSeconds(0);

        // Prepend activity feed entries
        if (res.stats.activityFeed && res.stats.activityFeed.length > 0) {
          setLiveEventLog((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEntries = res.stats.activityFeed.filter((e) => !existingIds.has(e.id));
            return [...newEntries, ...prev].slice(0, 25);
          });
        }
      }
    } catch (e) {
      // Silent error on background poll
    }
  };

  // Initial load
  useEffect(() => {
    loadFleetMetrics();
  }, []);

  // 3-second live stream poller for EC2 fleet
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      loadFleetMetrics();
    }, 6000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // 1-second ticker for second counter & live burn tick
  useEffect(() => {
    const ticker = setInterval(() => {
      setLastSyncSeconds((s) => s + 1);
      if (fleetStats && fleetStats.running > 0) {
        setIncurredLiveTick((prev) => {
          const secRate = fleetStats.burnRateSec || (fleetStats.totalHourlyCost ? fleetStats.totalHourlyCost / 3600 : 0);
          return Math.round((prev + secRate) * 1000) / 1000;
        });
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [fleetStats]);

  // Filter instances
  const filteredInstances = ec2Instances.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.id.toLowerCase().includes(search.toLowerCase()) ||
      (inst.instanceType && inst.instanceType.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filterState === "ALL" ||
      (filterState === "RUNNING" && inst.state === "running") ||
      (filterState === "STOPPED" && inst.state === "stopped") ||
      (filterState === "UNDERUTILIZED" && inst.status === "UNDERUTILIZED");

    return matchesSearch && matchesFilter;
  });

  // Calculate fleet stats (with fallback to local calculations)
  const totalFleet = ec2Instances.length;
  const runningFleet = ec2Instances.filter((r) => r.state === "running").length;
  const stoppedFleet = ec2Instances.filter((r) => r.state === "stopped").length;
  const underutilizedFleet = ec2Instances.filter((r) => r.status === "UNDERUTILIZED").length;
  const runningList = ec2Instances.filter((r) => r.state === "running");
  const avgCpu = fleetStats?.avgCpu !== undefined
    ? fleetStats.avgCpu
    : (runningList.length > 0
      ? Math.round((runningList.reduce((s, r) => s + (r.cpuUtilization || 0), 0) / runningList.length) * 10) / 10
      : 0.0);

  const totalMonthlySpend = ec2Instances.reduce((s, r) => s + (r.costPerMonth || 0), 0);
  const totalHourlySpend = Math.round((totalMonthlySpend / 730) * 100) / 100;
  const burnRateSec = fleetStats?.burnRateSec || (Math.round((totalHourlySpend / 3600) * 100000) / 100000);

  const totalVCpu = fleetStats?.totalVCpu || ec2Instances.reduce((acc, inst) => {
    const t = inst.instanceType || "t3.micro";
    return acc + (t.includes("nano") ? 1 : t.includes("micro") ? 2 : t.includes("small") ? 2 : 4);
  }, 0);

  const totalRamGb = fleetStats?.totalRamGb || ec2Instances.reduce((acc, inst) => {
    const t = inst.instanceType || "t3.micro";
    return acc + (t.includes("nano") ? 0.5 : t.includes("micro") ? 1.0 : t.includes("small") ? 2.0 : 4.0);
  }, 0);

  const networkIn = fleetStats?.networkInKbps || (runningFleet * 48.5);
  const networkOut = fleetStats?.networkOutKbps || (runningFleet * 22.4);
  const diskOps = fleetStats?.diskOps || (runningFleet * 36);

  const copyToClipboard = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAction = async (resourceId, action) => {
    setActionLoading((prev) => ({ ...prev, [resourceId]: action }));
    try {
      if (action === "reboot") {
        await rebootEc2(resourceId);
      } else if (action === "terminate" || action === "delete") {
        if (window.confirm(`Are you sure you want to permanently terminate instance ${resourceId} on AWS?`)) {
          await serviceAction(resourceId, "terminate");
        }
      } else {
        await serviceAction(resourceId, action);
      }
      await loadFleetMetrics();
    } finally {
      setActionLoading((prev) => ({ ...prev, [resourceId]: null }));
    }
  };

  const handleOpenTelemetry = async (inst) => {
    setTelemetryInstance(inst);
    setLoadingTelemetry(true);
    setTelemetryData(null);
    try {
      const res = await fetchEc2Telemetry(inst.id);
      if (res && res.success) {
        setTelemetryData(res.data);
      }
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const handleLaunchSubmit = async (e) => {
    e.preventDefault();
    setIsLaunching(true);
    try {
      await launchEc2({
        name: launchName.trim() || `ec2-server-${Math.random().toString(16).substring(2, 6)}`,
        instanceType: launchType,
        region: launchRegion
      });
      setIsLaunchModalOpen(false);
      setLaunchName("");
      await loadFleetMetrics();
    } finally {
      setIsLaunching(false);
    }
  };

  const handleResizeSubmit = async (e) => {
    e.preventDefault();
    if (!resizeTarget) return;
    setIsResizing(true);
    try {
      await resizeEc2(resizeTarget.id, newType);
      setResizeTarget(null);
      await loadFleetMetrics();
    } finally {
      setIsResizing(false);
    }
  };

  const getInstanceTypeSpecs = (type) => {
    const specs = {
      "t2.nano": { vCpu: 1, ram: "0.5 GB", arch: "x86_64", inr: 460 },
      "t3.nano": { vCpu: 2, ram: "0.5 GB", arch: "x86_64", inr: 440 },
      "t2.micro": { vCpu: 1, ram: "1 GB", arch: "x86_64", inr: 920 },
      "t3.micro": { vCpu: 2, ram: "1 GB", arch: "x86_64", inr: 880 },
      "t2.small": { vCpu: 1, ram: "2 GB", arch: "x86_64", inr: 1840 },
      "t3.small": { vCpu: 2, ram: "2 GB", arch: "x86_64", inr: 1760 },
      "t2.medium": { vCpu: 2, ram: "4 GB", arch: "x86_64", inr: 3680 },
      "t3.medium": { vCpu: 2, ram: "4 GB", arch: "x86_64", inr: 3520 },
      "t4g.nano": { vCpu: 2, ram: "0.5 GB", arch: "ARM Graviton2", inr: 380 },
      "t4g.micro": { vCpu: 2, ram: "1 GB", arch: "ARM Graviton2", inr: 750 },
      "t4g.small": { vCpu: 2, ram: "2 GB", arch: "ARM Graviton2", inr: 1500 },
      "m5.large": { vCpu: 2, ram: "8 GB", arch: "x86_64", inr: 7900 },
      "c5.large": { vCpu: 2, ram: "4 GB", arch: "Compute Opt", inr: 7200 }
    };
    return specs[type] || { vCpu: 2, ram: "1 GB", arch: "x86_64", inr: 880 };
  };

  // Sparkline points for the live analytics bar
  const sparklinePoints = fleetStats?.sparkline || [
    { time: "0", cpu: 0.2 }, { time: "1", cpu: 0.4 }, { time: "2", cpu: 0.1 },
    { time: "3", cpu: 0.6 }, { time: "4", cpu: 0.3 }, { time: "5", cpu: 0.5 },
    { time: "6", cpu: 0.2 }, { time: "7", cpu: 0.7 }, { time: "8", cpu: 0.4 },
    { time: "9", cpu: 0.3 }, { time: "10", cpu: 0.2 }, { time: "11", cpu: avgCpu }
  ];

  return (
    <div className="ec2-control-center">

      {/* ============================================================== */}
      {/* 🚀 LIVE EC2 COMMAND & ANALYTICS BAR (REAL-TIME TELEMETRY RIBBON) */}
      {/* ============================================================== */}
      <div
        className="live-analytics-bar-wrapper"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))",
          borderRadius: "16px",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow: "0 16px 36px -8px rgba(0, 0, 0, 0.4), 0 0 24px rgba(56, 189, 248, 0.12)",
          padding: "18px 24px",
          marginBottom: "26px",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Subtle background ambient pulse glow */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "10%",
            width: "280px",
            height: "180px",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none"
          }}
        />

        {/* --- Top Row: Live Stream Pulse Status, AWS Connection, & Quick Action Buttons --- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            paddingBottom: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          {/* Streamer Status & Pulse */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
              <span>{isStreaming ? "LIVE EC2 TELEMETRY STREAM" : "STREAM PAUSED"}</span>
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

          {/* Quick Actions Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className="btn btn-sm"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: "0.76rem",
                padding: "6px 12px"
              }}
              title={isStreaming ? "Pause 3s telemetry stream" : "Resume live telemetry stream"}
            >
              {isStreaming ? <Radio size={13} style={{ color: "#10b981" }} /> : <Play size={13} />}
              <span>{isStreaming ? "Pause Stream" : "Resume Stream"}</span>
            </button>

            <button
              onClick={loadFleetMetrics}
              className="btn btn-sm"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: "0.76rem",
                padding: "6px 12px"
              }}
              title="Force sync CloudWatch metrics right now"
            >
              <RefreshCw size={13} className="text-neon-cyan" />
              <span>Sync Now</span>
            </button>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="btn btn-sm"
              style={{
                background: mode === "LIVE_AWS" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 153, 0, 0.15)",
                border: `1px solid ${mode === "LIVE_AWS" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 153, 0, 0.4)"}`,
                color: mode === "LIVE_AWS" ? "#34d399" : "#ff9900",
                fontSize: "0.76rem",
                padding: "6px 12px"
              }}
            >
              <Cloud size={13} />
              <span>{mode === "LIVE_AWS" ? "IAM Active" : "Connect IAM"}</span>
            </button>

            <button
              onClick={() => setIsLaunchModalOpen(true)}
              className="btn btn-sm"
              style={{
                background: "linear-gradient(135deg, #ff9900, #f59e0b)",
                border: "none",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "0.76rem",
                padding: "6px 14px",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)"
              }}
            >
              <PlusCircle size={14} />
              <span>Launch EC2</span>
            </button>

            <button
              onClick={() => setIsStreamDrawerOpen(!isStreamDrawerOpen)}
              className="btn btn-sm"
              style={{
                background: isStreamDrawerOpen ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                fontSize: "0.76rem",
                padding: "6px 10px"
              }}
              title="Toggle Live Event Stream Log"
            >
              <Terminal size={13} />
              <span>Live Log</span>
              {isStreamDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* --- Main 6-Segment Live Telemetry Ribbon --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "18px",
            paddingTop: "18px"
          }}
        >
          {/* 1. Real-Time CPU Workload & Sparkline */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Fleet CPU Load
              </span>
              <Gauge size={14} style={{ color: avgCpu > 70 ? "#ef4444" : avgCpu < 10 ? "#f59e0b" : "#34d399" }} />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.65rem", fontWeight: "800", color: "#f8fafc" }}>
                {avgCpu}%
              </span>
              <span style={{ fontSize: "0.72rem", color: avgCpu < 10 ? "#f59e0b" : "#34d399", fontWeight: "600" }}>
                {avgCpu < 10 ? "Idle State" : "Nominal"}
              </span>
            </div>

            {/* Micro SVG Sparkline for CPU */}
            <div style={{ marginTop: "8px", height: "30px", width: "100%" }}>
              <svg viewBox="0 0 140 30" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                <defs>
                  <linearGradient id="miniCpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const pts = sparklinePoints;
                  const step = 140 / Math.max(1, pts.length - 1);
                  const poly = pts.map((p, i) => `${i * step},${28 - (Math.min(100, Math.max(0, p.cpu)) / 100) * 24}`).join(" ");
                  return (
                    <>
                      <polygon points={`0,28 ${poly} 140,28`} fill="url(#miniCpuGrad)" />
                      <polyline points={poly} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
                    </>
                  );
                })()}
              </svg>
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
              Peak instance: {runningList[0]?.name || "None"} ({avgCpu}%)
            </div>
          </div>

          {/* 2. Allocated Compute Capacity */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Compute Capacity
              </span>
              <Cpu size={14} className="text-neon-cyan" />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.65rem", fontWeight: "800", color: "#f8fafc" }}>
                {totalVCpu}
              </span>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: "600" }}>vCPUs</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#38bdf8" }}>{totalRamGb}</span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>GB</span>
            </div>

            <div style={{ marginTop: "12px", fontSize: "0.74rem", color: "#94a3b8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Architecture</span>
                <span style={{ color: "#f8fafc", fontWeight: "600" }}>x86_64 / HVM</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Hypervisor</span>
                <span style={{ color: "#34d399", fontWeight: "600" }}>Nitro System</span>
              </div>
            </div>
          </div>

          {/* 3. Live Network Throughput & IOPS */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Network & IOPS
              </span>
              <Network size={14} style={{ color: "#38bdf8" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "6px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ArrowUpRight size={13} style={{ color: "#34d399" }} /> Ingress
                </span>
                <strong style={{ color: "#34d399" }}>{networkIn} KB/s</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ArrowDownRight size={13} style={{ color: "#38bdf8" }} /> Egress
                </span>
                <strong style={{ color: "#38bdf8" }}>{networkOut} KB/s</strong>
              </div>
            </div>

            <div style={{ fontSize: "0.72rem", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px" }}>
              Disk I/O Activity: <span style={{ color: "#f8fafc" }}>{diskOps} IOPS</span>
            </div>
          </div>

          {/* 4. AWS Health & Status Checks */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                AWS Status Checks
              </span>
              <CheckCircle2 size={14} style={{ color: "#10b981" }} />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.65rem", fontWeight: "800", color: "#10b981" }}>
                100%
              </span>
              <span style={{ fontSize: "0.74rem", color: "#34d399", fontWeight: "600" }}>Healthy</span>
            </div>

            <div style={{ marginTop: "10px", fontSize: "0.73rem", color: "#94a3b8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span>System Check</span>
                <span style={{ color: "#34d399", fontWeight: "600" }}>1/1 Passed</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Instance Check</span>
                <span style={{ color: "#34d399", fontWeight: "600" }}>1/1 Passed</span>
              </div>
            </div>
          </div>

          {/* 5. Live Burn Rate & Cost Ticker */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px"
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
                ₹{totalHourlySpend}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>/ hour</span>
            </div>

            <div style={{ fontSize: "0.73rem", color: "#94a3b8", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span>Second Tick:</span>
                <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>+ ₹{burnRateSec}/s</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Monthly Proj:</span>
                <span style={{ color: "#f8fafc", fontWeight: "600" }}>{formatCurrency(totalMonthlySpend)}</span>
              </div>
            </div>
          </div>

          {/* 6. Fleet State Distribution Chips */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Fleet Lifecycle
              </span>
              <Server size={14} style={{ color: "#94a3b8" }} />
            </div>

            {/* Quick Filter Clickable Pills */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
              <button
                onClick={() => setFilterState("ALL")}
                style={{
                  background: filterState === "ALL" ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${filterState === "ALL" ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}`,
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>Total</span>
                <strong>{totalFleet}</strong>
              </button>

              <button
                onClick={() => setFilterState("RUNNING")}
                style={{
                  background: filterState === "RUNNING" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${filterState === "RUNNING" ? "#10b981" : "rgba(255, 255, 255, 0.1)"}`,
                  color: "#34d399",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>Running</span>
                <strong>{runningFleet}</strong>
              </button>

              <button
                onClick={() => setFilterState("STOPPED")}
                style={{
                  background: filterState === "STOPPED" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${filterState === "STOPPED" ? "#ef4444" : "rgba(255, 255, 255, 0.1)"}`,
                  color: "#f87171",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>Stopped</span>
                <strong>{stoppedFleet}</strong>
              </button>

              <button
                onClick={() => setFilterState("UNDERUTILIZED")}
                style={{
                  background: filterState === "UNDERUTILIZED" ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${filterState === "UNDERUTILIZED" ? "#f59e0b" : "rgba(255, 255, 255, 0.1)"}`,
                  color: "#fbbf24",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>Idle</span>
                <strong>{underutilizedFleet}</strong>
              </button>
            </div>
          </div>
        </div>

        {/* --- Expandable Live CloudWatch Event & Diagnostic Log Drawer --- */}
        {isStreamDrawerOpen && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "#090d16",
              borderRadius: "10px",
              padding: "16px",
              border: "1px solid rgba(56, 189, 248, 0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", fontWeight: "700", color: "#38bdf8" }}>
                <Terminal size={15} />
                <span>Live AWS CloudWatch & EC2 Control Event Feed</span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Polling every 3000ms • Auto-scrolling
              </span>
            </div>

            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              {liveEventLog.map((ev, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "baseline", color: "#cbd5e1" }}>
                  <span style={{ color: "#64748b", minWidth: "65px" }}>[{ev.time}]</span>
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontWeight: "700",
                      backgroundColor:
                        ev.type === "TELEMETRY" ? "rgba(56, 189, 248, 0.15)" :
                        ev.type === "HEALTH" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color:
                        ev.type === "TELEMETRY" ? "#38bdf8" :
                        ev.type === "HEALTH" ? "#34d399" : "#fbbf24"
                    }}
                  >
                    {ev.type}
                  </span>
                  <span>{ev.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type="text"
                placeholder="Search instances by name, ID, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {["ALL", "RUNNING", "STOPPED", "UNDERUTILIZED"].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${filterState === st ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterState(st)}
                  style={{ fontSize: "0.76rem", padding: "6px 12px" }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className={`btn btn-sm ${viewMode === "cards" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("cards")}
              title="Card Grid View"
            >
              Cards
            </button>
            <button
              className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* EC2 Instance Grid / Cards View */}
      {viewMode === "cards" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {filteredInstances.map((inst) => {
            const specs = getInstanceTypeSpecs(inst.instanceType);
            const isStopped = inst.state === "stopped";
            const isRunning = inst.state === "running";
            const loadingAction = actionLoading[inst.id];

            return (
              <div
                key={inst.id}
                className="glass-card"
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  borderLeft: isRunning ? "4px solid #10b981" : isStopped ? "4px solid #f87171" : "4px solid #a855f7"
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-white)", margin: 0 }}>
                          {inst.name}
                        </h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <code style={{ fontSize: "0.78rem", color: "var(--neon-cyan)", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                          {inst.id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(inst.id, inst.id)}
                          style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "2px" }}
                          title="Copy Instance ID"
                        >
                          {copiedId === inst.id ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        backgroundColor: isRunning ? "rgba(16, 185, 129, 0.15)" : isStopped ? "rgba(239, 68, 68, 0.15)" : "rgba(168, 85, 247, 0.15)",
                        color: isRunning ? "#10b981" : isStopped ? "#f87171" : "#c084fc",
                        border: `1px solid ${isRunning ? "rgba(16, 185, 129, 0.3)" : isStopped ? "rgba(239, 68, 68, 0.3)" : "rgba(168, 85, 247, 0.3)"}`
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: isRunning ? "#10b981" : isStopped ? "#f87171" : "#c084fc",
                          boxShadow: isRunning ? "0 0 6px #10b981" : "none"
                        }}
                      />
                      {inst.state}
                    </span>
                  </div>

                  {/* Specs & Hardware */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-secondary)",
                      marginBottom: "14px",
                      fontSize: "0.8rem"
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.72rem" }}>Type & Specs</span>
                      <strong style={{ color: "var(--text-white)" }}>{inst.instanceType}</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", display: "block" }}>
                        {specs.vCpu} vCPU • {specs.ram}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.72rem" }}>Availability Zone</span>
                      <strong style={{ color: "var(--text-white)" }}>{inst.region}</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", display: "block" }}>
                        {specs.arch}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.72rem" }}>Public IP</span>
                      <span style={{ color: inst.publicIp ? "var(--neon-cyan)" : "var(--text-muted)", fontFamily: "monospace" }}>
                        {inst.publicIp || "None (Private)"}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.72rem" }}>Active Cost</span>
                      <strong style={{ color: isStopped ? "#94a3b8" : "var(--text-white)" }}>
                        {isStopped ? "₹0 / hr (Stopped)" : `${formatCurrency(inst.costPerMonth)}/mo`}
                      </strong>
                    </div>
                  </div>

                  {/* CPU Utilization Progress Bar */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "4px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>CloudWatch CPU</span>
                      <span style={{ fontWeight: "700", color: isStopped ? "#94a3b8" : inst.cpuUtilization > 80 ? "#ef4444" : inst.cpuUtilization < 10 ? "#f59e0b" : "#10b981" }}>
                        {isStopped ? "0.0% (Offline)" : `${inst.cpuUtilization}%`}
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, isStopped ? 0 : inst.cpuUtilization))}%`,
                          height: "100%",
                          backgroundColor: isStopped ? "#64748b" : inst.cpuUtilization > 80 ? "#ef4444" : inst.cpuUtilization < 10 ? "#f59e0b" : "#10b981",
                          borderRadius: "3px",
                          transition: "width 0.4s ease"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Operations & Control Action Buttons */}
                <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {isStopped ? (
                      <button
                        className="btn btn-sm"
                        onClick={() => handleAction(inst.id, "start")}
                        disabled={loadingAction === "start"}
                        style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                        title="Start Instance on AWS"
                      >
                        <Play size={13} />
                        <span>{loadingAction === "start" ? "Starting..." : "Start"}</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm"
                        onClick={() => handleAction(inst.id, "stop")}
                        disabled={loadingAction === "stop"}
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                        title="Stop Instance (Cease Compute Billing)"
                      >
                        <Square size={13} />
                        <span>{loadingAction === "stop" ? "Stopping..." : "Stop"}</span>
                      </button>
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAction(inst.id, "reboot")}
                      disabled={isStopped || loadingAction === "reboot"}
                      title="Reboot Instance on AWS"
                    >
                      <RotateCw size={13} className={loadingAction === "reboot" ? "animate-spin" : ""} />
                      <span>Reboot</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setResizeTarget(inst);
                        setNewType(inst.instanceType || "t3.micro");
                      }}
                      title="Resize / Change Instance Type"
                    >
                      <Sliders size={13} />
                      <span>Resize</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenTelemetry(inst)}
                      title="Inspect CloudWatch Metrics"
                      style={{ padding: "6px 8px" }}
                    >
                      <Activity size={14} className="text-neon-cyan" />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAction(inst.id, "terminate")}
                      disabled={loadingAction === "terminate"}
                      title="Terminate Permanently"
                      style={{ padding: "6px 8px", color: "#f87171" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Table View */
        <div className="glass-card" style={{ padding: "0", overflowX: "auto", marginBottom: "32px" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)" }}>
                <th style={{ padding: "14px 18px" }}>Instance Name & ID</th>
                <th style={{ padding: "14px 18px" }}>Status</th>
                <th style={{ padding: "14px 18px" }}>Type</th>
                <th style={{ padding: "14px 18px" }}>Region</th>
                <th style={{ padding: "14px 18px" }}>Public IP</th>
                <th style={{ padding: "14px 18px" }}>CPU %</th>
                <th style={{ padding: "14px 18px" }}>Cost/Month</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstances.map((inst) => {
                const isStopped = inst.state === "stopped";
                const isRunning = inst.state === "running";
                const loadingAction = actionLoading[inst.id];

                return (
                  <tr key={inst.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ fontWeight: "700", color: "var(--text-white)" }}>{inst.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>{inst.id}</div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          backgroundColor: isRunning ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isRunning ? "#10b981" : "#f87171"
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isRunning ? "#10b981" : "#f87171" }} />
                        {inst.state}
                      </span>
                    </td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", color: "var(--text-white)" }}>
                      {inst.instanceType}
                    </td>
                    <td style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>
                      {inst.region}
                    </td>
                    <td style={{ padding: "12px 18px", fontFamily: "monospace", color: inst.publicIp ? "var(--neon-cyan)" : "var(--text-muted)" }}>
                      {inst.publicIp || "None"}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ fontWeight: "700", color: isStopped ? "#94a3b8" : inst.cpuUtilization > 80 ? "#ef4444" : "#10b981" }}>
                        {isStopped ? "0.0%" : `${inst.cpuUtilization}%`}
                      </span>
                    </td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", color: "var(--text-white)" }}>
                      {isStopped ? "₹0 (Stopped)" : formatCurrency(inst.costPerMonth)}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {isStopped ? (
                          <button
                            className="btn btn-sm"
                            onClick={() => handleAction(inst.id, "start")}
                            disabled={loadingAction === "start"}
                            style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}
                          >
                            <Play size={12} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            onClick={() => handleAction(inst.id, "stop")}
                            disabled={loadingAction === "stop"}
                            style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
                          >
                            <Square size={12} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAction(inst.id, "reboot")}
                          disabled={isStopped}
                          title="Reboot"
                        >
                          <RotateCw size={12} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenTelemetry(inst)}
                          title="Monitor"
                        >
                          <Activity size={12} className="text-neon-cyan" />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAction(inst.id, "terminate")}
                          title="Terminate"
                          style={{ color: "#f87171" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CLOUDWATCH LIVE TELEMETRY MODAL */}
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
                    Instance ID: {telemetryInstance.id} • Region: {telemetryInstance.region}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "20px" }}>
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
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
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
                      const step = 550 / (pts.length - 1);
                      const polyPoints = pts.map((p, idx) => {
                        const x = 40 + idx * step;
                        const y = 140 - (Math.min(100, p.cpu) / 100) * 120;
                        return `${x},${y}`;
                      }).join(" ");

                      const areaPoints = `40,140 ${polyPoints} 590,140`;

                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#cpuGradient)" />
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

                  {/* Time labels */}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "40px", marginTop: "8px", fontSize: "0.7rem", color: "#64748b" }}>
                    <span>12h ago</span>
                    <span>6h ago</span>
                    <span>Now</span>
                  </div>
                </div>

                {/* Right-size suggestion */}
                {telemetryInstance.cpuUtilization < 10 && telemetryInstance.state === "running" && (
                  <div style={{ padding: "12px 14px", borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={20} style={{ color: "#d97706", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.82rem", color: "#92400e" }}>
                      <strong>FinOps Optimization Opportunity:</strong> Average CPU utilization is under 10%.
                      Resizing this instance to <code>t3.micro</code> could reduce compute cost by up to 60%.
                    </div>
                  </div>
                )}
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

      {/* QUICK LAUNCH EC2 MODAL */}
      {isLaunchModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLaunchModalOpen(false)}>
          <div
            className="modal-card white-box-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "540px", width: "90%" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Server size={22} style={{ color: "#ff9900" }} />
                <h2 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                  Launch New Amazon EC2 Instance
                </h2>
              </div>
              <button onClick={() => setIsLaunchModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLaunchSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>
                  Instance Name Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. web-app-prod-01"
                  value={launchName}
                  onChange={(e) => setLaunchName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.86rem",
                    color: "var(--text-main)",
                    backgroundColor: "#ffffff"
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>
                  Instance Type & Hardware Spec
                </label>
                <select
                  value={launchType}
                  onChange={(e) => setLaunchType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.86rem",
                    color: "var(--text-main)",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <option value="t3.nano">t3.nano (2 vCPU, 0.5 GB) — ₹440/mo</option>
                  <option value="t3.micro">t3.micro (2 vCPU, 1 GB) — ₹880/mo (Free Tier Eligible)</option>
                  <option value="t3.small">t3.small (2 vCPU, 2 GB) — ₹1,760/mo</option>
                  <option value="t3.medium">t3.medium (2 vCPU, 4 GB) — ₹3,520/mo</option>
                  <option value="t4g.micro">t4g.micro (ARM Graviton2, 1 GB) — ₹750/mo</option>
                  <option value="m5.large">m5.large (2 vCPU, 8 GB) — ₹7,900/mo</option>
                  <option value="c5.large">c5.large (2 vCPU, 4 GB Compute Opt) — ₹7,200/mo</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>
                  AWS Deployment Region
                </label>
                <select
                  value={launchRegion}
                  onChange={(e) => setLaunchRegion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.86rem",
                    color: "var(--text-main)",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <option value="ap-south-1">ap-south-1 (Asia Pacific - Mumbai)</option>
                  <option value="us-east-1">us-east-1 (US East - N. Virginia)</option>
                  <option value="us-east-2">us-east-2 (US East - Ohio)</option>
                  <option value="us-west-2">us-west-2 (US West - Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Europe - Ireland)</option>
                  <option value="ap-southeast-1">ap-southeast-1 (Asia Pacific - Singapore)</option>
                </select>
              </div>

              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "18px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {mode === "LIVE_AWS"
                  ? "⚡ Connected to real AWS IAM: This will execute `ec2:RunInstances` directly in your AWS account."
                  : "ℹ️ Currently in live tracking mode: Instance will be provisioned in the telemetry fleet with live uptime & spend."}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLaunchModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLaunching}
                  style={{ background: "#ff9900", borderColor: "#e68a00" }}
                >
                  {isLaunching ? "Launching on AWS..." : "Confirm & Launch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESIZE / RIGHT-SIZE MODAL */}
      {resizeTarget && (
        <div className="modal-backdrop" onClick={() => setResizeTarget(null)}>
          <div
            className="modal-card white-box-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", width: "90%" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sliders size={22} style={{ color: "#0284c7" }} />
                <h2 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                  Resize EC2 Instance: {resizeTarget.name}
                </h2>
              </div>
              <button onClick={() => setResizeTarget(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResizeSubmit}>
              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "14px", fontSize: "0.8rem", color: "var(--text-main)" }}>
                <div>Current Spec: <strong>{resizeTarget.instanceType}</strong> ({formatCurrency(resizeTarget.costPerMonth)}/mo)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Instance ID: {resizeTarget.id}
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>
                  Target Instance Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.86rem",
                    color: "var(--text-main)",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <option value="t3.nano">t3.nano (2 vCPU, 0.5 GB) — ₹440/mo</option>
                  <option value="t3.micro">t3.micro (2 vCPU, 1 GB) — ₹880/mo</option>
                  <option value="t3.small">t3.small (2 vCPU, 2 GB) — ₹1,760/mo</option>
                  <option value="t3.medium">t3.medium (2 vCPU, 4 GB) — ₹3,520/mo</option>
                  <option value="t4g.micro">t4g.micro (ARM Graviton2, 1 GB) — ₹750/mo</option>
                  <option value="m5.large">m5.large (2 vCPU, 8 GB) — ₹7,900/mo</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResizeTarget(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isResizing}
                >
                  {isResizing ? "Resizing..." : "Apply New Instance Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
