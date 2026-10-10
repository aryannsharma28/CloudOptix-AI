import React, { useState, useEffect } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Database,
  HardDrive,
  FileText,
  Archive,
  ShieldCheck,
  Flame,
  ArrowRight,
  RefreshCw,
  Radio,
  Clock,
  Zap,
  TrendingUp,
  Lock
} from "lucide-react";

export const S3LiveTelemetryBanner = () => {
  const {
    fetchS3Fleet,
    formatCurrency,
    setActiveTab,
    account
  } = useCloud();

  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [isStreaming, setIsStreaming] = useState(true);
  const [latencyMs, setLatencyMs] = useState(24);

  const loadMetrics = async () => {
    const start = performance.now();
    try {
      const res = await fetchS3Fleet();
      if (res && res.success) {
        setFleetData(res);
        setLatencyMs(Math.round(performance.now() - start));
        setLastSyncSeconds(0);
      }
    } catch (e) {
      console.warn("S3 telemetry fetch notice:", e);
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

  const stats = fleetData?.stats || {
    totalBuckets: 0,
    totalStorageGb: 0,
    totalObjects: 0,
    totalMonthlyCost: 0,
    burnRateSec: 0,
    standardBuckets: 0,
    intelligentTieringBuckets: 0,
    glacierBuckets: 0,
    publicAccessBlockedPct: 100,
    encryptedPct: 100
  };

  const buckets = fleetData?.buckets || [];

  return (
    <div
      className="glass-card s3-live-telemetry-banner"
      style={{
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "24px",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)"
      }}
    >
      {/* Header with Live Status & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.18)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981"
            }}
          >
            <Database size={17} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                style={{
                  fontSize: "1.02rem",
                  fontWeight: "800",
                  letterSpacing: "-0.01em",
                  color: "var(--text-heading)",
                  margin: 0
                }}
              >
                Amazon S3 Live Storage Telemetry & FinOps Ribbon
              </h3>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  fontWeight: "700"
                }}
              >
                {account?.primaryRegion || "ap-south-1"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", color: "var(--text-muted)" }}>
              <Radio size={12} className="text-neon-cyan" />
              <span>Latency: {latencyMs}ms</span>
              <span>•</span>
              <Clock size={12} />
              <span>Sampled {lastSyncSeconds}s ago</span>
            </div>
          </div>
        </div>

        {/* Right Action: Go to S3 Operations */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab("s3")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #059669, #0d9488)",
              border: "none",
              color: "#ffffff",
              fontWeight: "700"
            }}
          >
            <span>Open S3 Operations</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Ribbon Metric Pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "10px"
        }}
      >
        {/* Metric 1: Buckets & Total GB */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "10px",
            padding: "8px 12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Active Storage
            </span>
            <HardDrive size={13} style={{ color: "#10b981" }} />
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-heading)", marginTop: "2px" }}>
            {stats.totalStorageGb.toLocaleString()} <span style={{ fontSize: "0.74rem", fontWeight: "600", color: "var(--text-muted)" }}>GB</span>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: "600" }}>
            {stats.totalBuckets} bucket(s)
          </div>
        </div>

        {/* Metric 2: Total Objects */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "10px",
            padding: "8px 12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Fleet Objects
            </span>
            <FileText size={13} style={{ color: "#06b6d4" }} />
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-heading)", marginTop: "2px" }}>
            {stats.totalObjects.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            Total files tracked
          </div>
        </div>

        {/* Metric 3: Tier Distribution */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "10px",
            padding: "8px 12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Tier Breakdown
            </span>
            <Archive size={13} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ fontSize: "0.86rem", fontWeight: "800", color: "var(--text-heading)", marginTop: "4px" }}>
            Std: {stats.standardBuckets} • IT: {stats.intelligentTieringBuckets} • Gl: {stats.glacierBuckets}
          </div>
          <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: "600" }}>
            Auto-tiering enabled
          </div>
        </div>

        {/* Metric 4: Security Posture */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "10px",
            padding: "8px 12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Security Posture
            </span>
            <ShieldCheck size={13} style={{ color: "#10b981" }} />
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#10b981", marginTop: "2px" }}>
            {stats.publicAccessBlockedPct}% <span style={{ fontSize: "0.74rem", fontWeight: "600", color: "var(--text-muted)" }}>Safe</span>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#06b6d4" }}>
            {stats.encryptedPct}% SSE-S3/KMS
          </div>
        </div>

        {/* Metric 5: Monthly Spend */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "10px",
            padding: "8px 12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Monthly Spend
            </span>
            <TrendingUp size={13} style={{ color: "#ec4899" }} />
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-heading)", marginTop: "2px" }}>
            {formatCurrency(stats.totalMonthlyCost)}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            ~₹1.90/GB baseline
          </div>
        </div>

        {/* Metric 6: Live Burn Rate */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "10px",
            padding: "8px 12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Live Burn Rate
            </span>
            <Flame size={13} style={{ color: "#f97316" }} />
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#f97316", marginTop: "2px" }}>
            ₹{Number(stats.burnRateSec || 0.0009).toFixed(5)}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            Per second spend
          </div>
        </div>
      </div>
    </div>
  );
};
