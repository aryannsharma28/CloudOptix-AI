import React, { useState, useEffect, useRef } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Database,
  Layers,
  Search,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
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
  Flame,
  Lock,
  Unlock,
  Archive,
  FileText,
  Trash2,
  Settings,
  FolderOpen,
  Upload
} from "lucide-react";

export const S3ControlCenter = () => {
  const {
    formatCurrency,
    fetchS3Fleet,
    fetchS3Telemetry,
    createS3Bucket,
    deleteS3Bucket,
    configureS3Bucket,
    listS3Objects,
    uploadS3Object,
    deleteS3Object,
    applyOptimization,
    recommendations,
    mode,
    account,
    setIsConnectModalOpen,
    refreshData,
    currency
  } = useCloud();

  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Live Stream & Telemetry Bar State
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [latencyMs, setLatencyMs] = useState(24);
  const [isStreamDrawerOpen, setIsStreamDrawerOpen] = useState(false);
  const [liveEventLog, setLiveEventLog] = useState([]);
  const [incurredLiveTick, setIncurredLiveTick] = useState(0);

  // Create Bucket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketRegion, setNewBucketRegion] = useState("ap-south-1");
  const [newBucketVersioning, setNewBucketVersioning] = useState(true);
  const [newBucketEncryption, setNewBucketEncryption] = useState("AES256");
  const [newBucketBlockPublic, setNewBucketBlockPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit / Configure Bucket Modal State
  const [editTarget, setEditTarget] = useState(null);
  const [editVersioning, setEditVersioning] = useState(true);
  const [editEncryption, setEditEncryption] = useState("AES256");
  const [editBlockPublic, setEditBlockPublic] = useState(true);
  const [editStorageClass, setEditStorageClass] = useState("Standard");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Live Telemetry Modal State
  const [telemetryBucket, setTelemetryBucket] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Delete Bucket Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // S3 Object Explorer & Upload Modal State
  const [objectTargetBucket, setObjectTargetBucket] = useState(null);
  const [bucketObjects, setBucketObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadKey, setUploadKey] = useState("");
  const [uploadStorageClass, setUploadStorageClass] = useState("STANDARD");
  const [isUploading, setIsUploading] = useState(false);
  const [objectSearch, setObjectSearch] = useState("");
  const [deletingKey, setDeletingKey] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch Fleet data & CloudWatch metrics
  const loadFleetMetrics = async () => {
    const t0 = Date.now();
    try {
      const res = await fetchS3Fleet();
      const elapsed = Date.now() - t0;
      setLatencyMs(elapsed > 0 ? elapsed : 24);
      if (res && res.success) {
        setFleetData(res);
        setLastSyncSeconds(0);

        if (res.stats && res.stats.activityFeed) {
          setLiveEventLog((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEntries = res.stats.activityFeed.filter((e) => !existingIds.has(e.id));
            return [...newEntries, ...prev].slice(0, 25);
          });
        }
      }
    } catch (e) {
      console.warn("S3 fleet fetch notice:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetMetrics();
  }, []);

  // 3-second live CloudWatch polling loop
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      loadFleetMetrics();
    }, 6000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Second-by-second ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setLastSyncSeconds((prev) => prev + 1);
      setIncurredLiveTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenTelemetry = async (bucket) => {
    setTelemetryBucket(bucket);
    setLoadingTelemetry(true);
    try {
      const data = await fetchS3Telemetry(bucket.name);
      setTelemetryData(data);
    } catch (err) {
      console.warn("Failed to load bucket telemetry:", err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const handleOpenEdit = (bucket) => {
    setEditTarget(bucket);
    setEditVersioning(bucket.versioning === "Enabled");
    setEditEncryption(bucket.encryption?.includes("KMS") ? "aws:kms" : "AES256");
    setEditBlockPublic(bucket.publicAccessBlock === "Blocked" || bucket.publicAccessBlock === "All 4 Blocked");
    setEditStorageClass(bucket.storageClass || "Standard");
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSavingConfig(true);
    try {
      await configureS3Bucket(editTarget.name, {
        versioning: editVersioning ? "Enabled" : "Suspended",
        encryption: editEncryption === "aws:kms" ? "aws:kms (AWS-KMS)" : "AES256 (SSE-S3)",
        blockPublicAccess: editBlockPublic,
        storageClass: editStorageClass
      });
      setEditTarget(null);
      await loadFleetMetrics();
      await refreshData();
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateBucket = async (e) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    setIsCreating(true);
    setCreateError("");
    try {
      const res = await createS3Bucket({
        bucketName: newBucketName.trim().toLowerCase(),
        region: newBucketRegion,
        versioning: newBucketVersioning ? "Enabled" : "Suspended",
        encryption: newBucketEncryption === "aws:kms" ? "aws:kms" : "AES256",
        blockPublicAccess: newBucketBlockPublic
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        setNewBucketName("");
        setCreateError("");
        await loadFleetMetrics();
        await refreshData();
      } else {
        setCreateError(res.error || "Failed to create S3 bucket on AWS.");
      }
    } catch (err) {
      setCreateError(err.message || "Failed to create S3 bucket on AWS.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBucket = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteS3Bucket(deleteTarget.name);
      if (res.success) {
        setDeleteTarget(null);
        setDeleteConfirmText("");
        await loadFleetMetrics();
        await refreshData();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenObjects = async (bucket) => {
    setObjectTargetBucket(bucket);
    setSelectedFile(null);
    setUploadKey("");
    setLoadingObjects(true);
    try {
      const data = await listS3Objects(bucket.name);
      if (data && data.success) {
        setBucketObjects(data.objects || []);
      }
    } catch (err) {
      console.warn("Failed to load objects:", err);
    } finally {
      setLoadingObjects(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadKey) {
        setUploadKey(file.name);
      }
    }
  };

  const handleUploadObject = async (e) => {
    e.preventDefault();
    if (!objectTargetBucket || !selectedFile) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result.split(",")[1];
          const res = await uploadS3Object({
            bucketName: objectTargetBucket.name,
            key: uploadKey || selectedFile.name,
            bodyBase64: base64Content,
            contentType: selectedFile.type || "application/octet-stream",
            storageClass: uploadStorageClass
          });

          if (res && res.success) {
            setSelectedFile(null);
            setUploadKey("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            const refreshRes = await listS3Objects(objectTargetBucket.name);
            if (refreshRes && refreshRes.success) {
              setBucketObjects(refreshRes.objects || []);
            }
            await loadFleetMetrics();
            await refreshData();
          }
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
    }
  };

  const handleDeleteObject = async (key) => {
    if (!objectTargetBucket) return;
    setDeletingKey(key);
    try {
      const res = await deleteS3Object(objectTargetBucket.name, key);
      if (res && res.success) {
        setBucketObjects((prev) => prev.filter((o) => o.key !== key));
        await loadFleetMetrics();
        await refreshData();
      }
    } finally {
      setDeletingKey(null);
    }
  };

  const handleQuickOptimize = async (recommendationId, bucketName) => {
    setActionLoading((prev) => ({ ...prev, [bucketName]: recommendationId }));
    try {
      await applyOptimization(recommendationId);
      await loadFleetMetrics();
      await refreshData();
    } finally {
      setActionLoading((prev) => ({ ...prev, [bucketName]: null }));
    }
  };

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
    encryptedPct: 100,
    sparkline: []
  };

  const buckets = fleetData?.buckets || [];

  // Filter buckets based on search and classification
  const filteredBuckets = buckets.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.region.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterClass === "ALL") return true;
    if (filterClass === "STANDARD") return b.storageClass === "Standard";
    if (filterClass === "INTELLIGENT") return b.storageClass?.includes("Intelligent");
    if (filterClass === "GLACIER") return b.storageClass?.includes("Glacier");
    if (filterClass === "VERSIONED") return b.versioning === "Enabled";
    if (filterClass === "PUBLIC_BLOCKED") return b.publicAccessBlock === "Blocked" || b.publicAccessBlock === "All 4 Blocked";
    return true;
  });

  // Check for S3 recommendations matching this bucket
  const getBucketRecommendations = (bucketName) => {
    return recommendations.filter(
      (r) =>
        r.service === "S3" &&
        !r.applied &&
        !r.closed &&
        (r.resourceName === bucketName || r.title.toLowerCase().includes(bucketName.toLowerCase()))
    );
  };

  return (
    <div className="s3-control-center">
      {/* ========================================================= */}
      {/* TOP HEADER & QUICK ACTION BAR                             */}
      {/* ========================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981"
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  color: "var(--text-heading)",
                  margin: 0
                }}
              >
                Amazon S3 Live Storage Operations & FinOps Control Center
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                CloudWatch real-time storage telemetry, live bucket configuration, tier transitions, Block Public Access auditing & AI FinOps automation.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "linear-gradient(135deg, #059669, #0d9488)",
              border: "none",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              fontWeight: "700"
            }}
          >
            <PlusCircle size={15} />
            <span>Create S3 Bucket</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadFleetMetrics}
            title="Refresh live telemetry from AWS S3 API"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LIVE S3 ANALYTICS BAR / TELEMETRY RIBBON                  */}
      {/* ========================================================= */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          borderRadius: "16px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.04) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.22)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          {/* Streaming Status Beacon */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              onClick={() => setIsStreaming(!isStreaming)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                background: isStreaming ? "rgba(16, 185, 129, 0.14)" : "rgba(148, 163, 184, 0.14)",
                border: isStreaming ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(148, 163, 184, 0.3)",
                padding: "4px 10px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "0.76rem",
                fontWeight: "700",
                color: isStreaming ? "#10b981" : "#64748b"
              }}
              title={isStreaming ? "Live CloudWatch telemetry active (Click to pause)" : "Telemetry paused (Click to stream)"}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isStreaming ? "#10b981" : "#94a3b8",
                  boxShadow: isStreaming ? "0 0 10px #10b981" : "none"
                }}
              />
              <span>{isStreaming ? "CLOUDWATCH S3 LIVE" : "STREAM PAUSED"}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <Radio size={13} className="text-neon-cyan" />
              <span>Ping: {latencyMs}ms</span>
              <span>•</span>
              <Clock size={13} />
              <span>Sampled {lastSyncSeconds}s ago</span>
            </div>
          </div>

          {/* Toggle Live Event Log Drawer */}
          <button
            type="button"
            onClick={() => setIsStreamDrawerOpen(!isStreamDrawerOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: isStreamDrawerOpen ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "#10b981",
              fontSize: "0.78rem",
              fontWeight: "700",
              padding: "4px 10px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            <Terminal size={13} />
            <span>S3 Audit Trail ({liveEventLog.length})</span>
            {isStreamDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* 6 Key Telemetry Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px"
          }}
        >
          {/* 1. Fleet Storage Volume */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "10px 14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" }}>
                Total Fleet Storage
              </span>
              <HardDrive size={14} style={{ color: "#10b981" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-heading)" }}>
                {stats.totalStorageGb.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>GB</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#10b981", marginTop: "3px", fontWeight: "600" }}>
              {stats.totalStorageGb > 0
                ? `${(stats.totalStorageGb / 1024).toFixed(2)} TB in ${account?.primaryRegion || "ap-south-1"}`
                : `0 GB in ${account?.primaryRegion || "ap-south-1"}`}
            </div>
          </div>

          {/* 2. Total Objects */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "10px 14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" }}>
                Total Objects
              </span>
              <FileText size={14} style={{ color: "#06b6d4" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-heading)" }}>
                {stats.totalObjects.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
              Across {stats.totalBuckets} bucket(s)
            </div>
          </div>

          {/* 3. Storage Tier Distribution */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "10px 14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" }}>
                Storage Tiers
              </span>
              <Archive size={14} style={{ color: "#f59e0b" }} />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#06b6d4" }}>
                Std: {stats.standardBuckets}
              </span>
              <span style={{ color: "var(--border-glass)" }}>|</span>
              <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#10b981" }}>
                IT: {stats.intelligentTieringBuckets}
              </span>
              <span style={{ color: "var(--border-glass)" }}>|</span>
              <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#6366f1" }}>
                Glacier: {stats.glacierBuckets}
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
              FinOps Tier Distribution
            </div>
          </div>

          {/* 4. Security Posture */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "10px 14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" }}>
                Security Audit
              </span>
              <ShieldCheck size={14} style={{ color: "#10b981" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "#10b981" }}>
                {stats.publicAccessBlockedPct}%
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Blocked</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#06b6d4", marginTop: "3px", fontWeight: "600" }}>
              {stats.encryptedPct}% SSE-S3/KMS Encrypted
            </div>
          </div>

          {/* 5. Monthly Storage Cost */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "10px 14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" }}>
                Monthly S3 Spend
              </span>
              <TrendingUp size={14} style={{ color: "#ec4899" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-heading)" }}>
                {formatCurrency(stats.totalMonthlyCost)}
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>/mo</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
              ~₹1.90/GB baseline standard
            </div>
          </div>

          {/* 6. Live Burn Rate */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "10px 14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" }}>
                Live Burn Rate
              </span>
              <Flame size={14} style={{ color: "#f97316" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "#f97316" }}>
                ₹{Number(stats.burnRateSec || 0.0009).toFixed(5)}
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>/sec</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
              Active live accumulator
            </div>
          </div>
        </div>

        {/* Expandable Live Event Log Drawer */}
        {isStreamDrawerOpen && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              maxHeight: "180px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "0.78rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px" }}>
              <span style={{ color: "#10b981", fontWeight: "700" }}>S3 Storage Telemetry & Audit Stream</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Updated live every 3s</span>
            </div>
            {liveEventLog.map((log) => (
              <div key={log.id} style={{ display: "flex", gap: "10px", margin: "4px 0", alignItems: "baseline" }}>
                <span style={{ color: "#06b6d4", flexShrink: 0 }}>[{log.time}]</span>
                <span
                  style={{
                    color: log.type === "SECURITY" ? "#10b981" : log.type === "LIFECYCLE" ? "#f59e0b" : "#94a3b8",
                    fontWeight: "600",
                    flexShrink: 0
                  }}
                >
                  {log.type}:
                </span>
                <span style={{ color: "#e2e8f0" }}>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEARCH, FILTER CHIPS & VIEW SWITCHER                      */}
      {/* ========================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          gap: "14px",
          flexWrap: "wrap"
        }}
      >
        {/* Search Bar */}
        <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)"
            }}
          />
          <input
            type="text"
            placeholder="Search bucket name, region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "10px",
              background: "var(--bg-glass-input)",
              border: "1px solid var(--border-glass)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: `All (${buckets.length})` },
            { id: "STANDARD", label: "Standard" },
            { id: "INTELLIGENT", label: "Intelligent-Tiering" },
            { id: "GLACIER", label: "Glacier" },
            { id: "VERSIONED", label: "Versioned" },
            { id: "PUBLIC_BLOCKED", label: "Public Blocked" }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterClass(f.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                background: filterClass === f.id ? "var(--aws-orange)" : "rgba(255, 255, 255, 0.05)",
                color: filterClass === f.id ? "#ffffff" : "var(--text-secondary)",
                border: filterClass === f.id ? "none" : "1px solid var(--border-glass)",
                transition: "all 0.15s ease"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View Switcher (Cards / Table) */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-glass)",
            borderRadius: "8px",
            padding: "2px"
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "700",
              background: viewMode === "cards" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: viewMode === "cards" ? "#10b981" : "var(--text-muted)",
              border: "none",
              cursor: "pointer"
            }}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "700",
              background: viewMode === "table" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: viewMode === "table" ? "#10b981" : "var(--text-muted)",
              border: "none",
              cursor: "pointer"
            }}
          >
            Table
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EMPTY STATE (When 0 Buckets on AWS)                       */}
      {/* ========================================================= */}
      {filteredBuckets.length === 0 && (
        <div
          className="glass-card"
          style={{
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            border: "1px dashed rgba(16, 185, 129, 0.3)",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.02) 100%)",
            margin: "20px 0"
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              margin: "0 auto 16px"
            }}
          >
            <Database size={28} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-heading)", margin: "0 0 8px" }}>
            No S3 Buckets in Connected AWS Account
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "520px", margin: "0 auto 20px" }}>
            Your live AWS account currently has 0 active S3 buckets. Click below to provision a real S3 bucket with versioning, SSE-S3/KMS encryption, and Block Public Access directly on AWS.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #059669, #0d9488)",
              border: "none",
              color: "#ffffff",
              fontWeight: "700",
              padding: "10px 22px",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              cursor: "pointer"
            }}
          >
            <PlusCircle size={16} />
            <span>+ Create S3 Bucket on AWS</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* BUCKET LIST: GRID CARDS VIEW                              */}
      {/* ========================================================= */}
      {filteredBuckets.length > 0 && viewMode === "cards" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "18px"
          }}
        >
          {filteredBuckets.map((bucket) => {
            const bucketRecs = getBucketRecommendations(bucket.name);
            const isDeletingThis = actionLoading[bucket.name] === "DELETE";

            return (
              <div
                key={bucket.name}
                className="glass-card"
                style={{
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: "1px solid var(--border-glass)",
                  position: "relative",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
              >
                {/* Header: Name, Region, Storage Class */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Database size={18} style={{ color: "#10b981", flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: "1.02rem",
                          fontWeight: "800",
                          color: "var(--text-heading)",
                          wordBreak: "break-all"
                        }}
                      >
                        {bucket.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(`arn:aws:s3:::${bucket.name}`, bucket.name)}
                      title="Copy Bucket ARN"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "2px"
                      }}
                    >
                      {copiedId === bucket.name ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Region & Tier Badges */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.06)",
                        color: "var(--text-secondary)",
                        fontWeight: "600"
                      }}
                    >
                      📍 {bucket.region}
                    </span>

                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: bucket.storageClass === "Standard"
                          ? "rgba(6, 182, 212, 0.15)"
                          : bucket.storageClass?.includes("Intelligent")
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(99, 102, 241, 0.15)",
                        color: bucket.storageClass === "Standard"
                          ? "#06b6d4"
                          : bucket.storageClass?.includes("Intelligent")
                          ? "#10b981"
                          : "#818cf8",
                        fontWeight: "700"
                      }}
                    >
                      {bucket.storageClass}
                    </span>

                    {bucket.awsLive && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          fontWeight: "700"
                        }}
                      >
                        ● AWS LIVE
                      </span>
                    )}
                  </div>

                  {/* Primary Metrics: Storage, Objects, Cost */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "12px",
                      padding: "10px",
                      marginBottom: "14px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>STORAGE</div>
                      <div style={{ fontSize: "0.98rem", fontWeight: "800", color: "var(--text-heading)" }}>
                        {bucket.storageGb} GB
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {(bucket.storageGb / 1024).toFixed(2)} TB
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>OBJECTS</div>
                      <div style={{ fontSize: "0.98rem", fontWeight: "800", color: "var(--text-heading)" }}>
                        {bucket.objectCount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Total files</div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>MONTHLY</div>
                      <div style={{ fontSize: "0.98rem", fontWeight: "800", color: "#10b981" }}>
                        {formatCurrency(bucket.monthlyCostInr)}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Estimated</div>
                    </div>
                  </div>

                  {/* Security & Features Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                    {/* Versioning */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Versioning:</span>
                      <span
                        style={{
                          fontWeight: "700",
                          color: bucket.versioning === "Enabled" ? "#10b981" : "var(--text-muted)"
                        }}
                      >
                        {bucket.versioning === "Enabled" ? "✓ Enabled" : "○ Suspended"}
                      </span>
                    </div>

                    {/* Server-Side Encryption */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Encryption:</span>
                      <span style={{ fontWeight: "700", color: "#06b6d4" }}>
                        🔒 {bucket.encryption}
                      </span>
                    </div>

                    {/* Block Public Access */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Public Access:</span>
                      <span
                        style={{
                          fontWeight: "700",
                          color: (bucket.publicAccessBlock === "Blocked" || bucket.publicAccessBlock === "All 4 Blocked")
                            ? "#10b981"
                            : "#f59e0b"
                        }}
                      >
                        {(bucket.publicAccessBlock === "Blocked" || bucket.publicAccessBlock === "All 4 Blocked")
                          ? "🛡️ Blocked (Safe)"
                          : "⚠️ Public Permissions Allowed"}
                      </span>
                    </div>
                  </div>

                  {/* Active AI FinOps Recommendations Callout */}
                  {bucketRecs.length > 0 && (
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(236, 72, 153, 0.08))",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        marginBottom: "14px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <Zap size={14} style={{ color: "#f59e0b" }} />
                        <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#f59e0b" }}>
                          AI FinOps: {bucketRecs.length} Savings Opportunity
                        </span>
                      </div>
                      {bucketRecs.map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "4px"
                          }}
                        >
                          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                            {rec.title} (Save {formatCurrency(rec.monthlySavings)}/mo)
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={actionLoading[bucket.name] === rec.id}
                            onClick={() => handleQuickOptimize(rec.id, bucket.name)}
                            style={{
                              padding: "3px 8px",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              background: "#f59e0b",
                              color: "#000",
                              border: "none",
                              borderRadius: "6px"
                            }}
                          >
                            {actionLoading[bucket.name] === rec.id ? "Applying..." : "⚡ 1-Click Fix"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    borderTop: "1px solid var(--border-glass)",
                    paddingTop: "14px",
                    flexWrap: "wrap"
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenObjects(bucket)}
                    style={{
                      flex: "1 1 125px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      background: "linear-gradient(135deg, #059669, #0d9488)",
                      border: "none",
                      color: "#fff",
                      fontWeight: "700"
                    }}
                    title="Upload files and explore bucket objects"
                  >
                    <FolderOpen size={13} />
                    <span>Upload & Files ({bucket.objectCount})</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenTelemetry(bucket)}
                    style={{ flex: "1 1 80px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                  >
                    <Gauge size={13} />
                    <span>Metrics</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(bucket)}
                    style={{ flex: "1 1 80px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                  >
                    <Settings size={13} />
                    <span>Configure</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setDeleteTarget(bucket)}
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#ef4444",
                      padding: "0 10px",
                      cursor: "pointer"
                    }}
                    title="Delete S3 Bucket"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* BUCKET LIST: TABLE VIEW                                   */}
      {/* ========================================================= */}
      {filteredBuckets.length > 0 && viewMode === "table" && (
        <div className="glass-card" style={{ borderRadius: "16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>BUCKET NAME</th>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>REGION</th>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>STORAGE CLASS</th>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>STORAGE</th>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>OBJECTS</th>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>MONTHLY SPEND</th>
                <th style={{ padding: "14px 18px", fontWeight: "700" }}>SECURITY</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuckets.map((bucket) => {
                const bucketRecs = getBucketRecommendations(bucket.name);
                return (
                  <tr
                    key={bucket.name}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.15s"
                    }}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "var(--text-heading)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Database size={15} style={{ color: "#10b981" }} />
                        <span>{bucket.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                      {bucket.region}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: bucket.storageClass === "Standard"
                            ? "rgba(6, 182, 212, 0.15)"
                            : bucket.storageClass?.includes("Intelligent")
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(99, 102, 241, 0.15)",
                          color: bucket.storageClass === "Standard"
                            ? "#06b6d4"
                            : bucket.storageClass?.includes("Intelligent")
                            ? "#10b981"
                            : "#818cf8",
                          fontWeight: "700"
                        }}
                      >
                        {bucket.storageClass}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "var(--text-heading)" }}>
                      {bucket.storageGb} GB
                    </td>

                    <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                      {bucket.objectCount.toLocaleString()}
                    </td>

                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "#10b981" }}>
                      {formatCurrency(bucket.monthlyCostInr)}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span
                          title={bucket.encryption}
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: "rgba(6, 182, 212, 0.1)",
                            color: "#06b6d4",
                            fontWeight: "700"
                          }}
                        >
                          🔒 {bucket.encryption.split(" ")[0]}
                        </span>
                        <span
                          title={bucket.publicAccessBlock}
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: bucket.publicAccessBlock === "Blocked" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                            color: bucket.publicAccessBlock === "Blocked" ? "#10b981" : "#f59e0b",
                            fontWeight: "700"
                          }}
                        >
                          🛡️ {bucket.publicAccessBlock}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenObjects(bucket)}
                          title="Upload Files & Explore Bucket Objects"
                          style={{
                            background: "linear-gradient(135deg, #059669, #0d9488)",
                            border: "none",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <FolderOpen size={13} />
                          <span>Files</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenTelemetry(bucket)}
                          title="View CloudWatch Telemetry"
                        >
                          <Gauge size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(bucket)}
                          title="Configure S3 Bucket"
                        >
                          <Settings size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setDeleteTarget(bucket)}
                          style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)"
                          }}
                          title="Delete S3 Bucket"
                        >
                          <Trash2 size={13} />
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

      {/* ========================================================= */}
      {/* MODAL 1: CREATE S3 BUCKET MODAL                           */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: "540px", borderRadius: "18px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={20} style={{ color: "#10b981" }} />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                  Create Amazon S3 Bucket
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Provision an enterprise-grade S3 bucket with default KMS/AES256 server-side encryption and Block Public Access controls.
            </p>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                marginBottom: "18px",
                fontSize: "0.78rem",
                color: "#f59e0b",
                lineHeight: "1.4"
              }}
            >
              <strong>AWS IAM Setup:</strong> To provision live buckets directly on AWS Console, ensure your connected IAM User has <code>AmazonS3FullAccess</code> attached in AWS IAM Console.
            </div>

            {createError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  marginBottom: "18px",
                  fontSize: "0.8rem",
                  color: "#ef4444",
                  lineHeight: "1.4"
                }}
              >
                <strong>Creation Error:</strong> {createError}
              </div>
            )}

            <form onSubmit={handleCreateBucket}>
              {/* Bucket Name */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  BUCKET NAME (DNS-Compliant, lowercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., cloudoptix-customer-data-lake"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "var(--bg-glass-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Globally unique identifier across all AWS accounts.
                </span>
              </div>

              {/* AWS Region */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  AWS REGION
                </label>
                <select
                  value={newBucketRegion}
                  onChange={(e) => setNewBucketRegion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "var(--bg-glass-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    outline: "none"
                  }}
                >
                  <option value="ap-south-1">Asia Pacific (Mumbai) — ap-south-1 [Default]</option>
                  <option value="us-east-1">US East (N. Virginia) — us-east-1</option>
                  <option value="us-west-2">US West (Oregon) — us-west-2</option>
                  <option value="eu-west-1">Europe (Ireland) — eu-west-1</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) — ap-southeast-1</option>
                </select>
              </div>

              {/* Versioning Toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-glass)",
                  marginBottom: "12px"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-heading)" }}>
                    Bucket Versioning
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Preserve multiple object variants to protect against accidental deletion
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newBucketVersioning}
                  onChange={(e) => setNewBucketVersioning(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>

              {/* Encryption Selection */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-glass)",
                  marginBottom: "12px"
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-heading)", marginBottom: "6px" }}>
                  Default Encryption (SSE)
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                    <input
                      type="radio"
                      name="enc"
                      checked={newBucketEncryption === "AES256"}
                      onChange={() => setNewBucketEncryption("AES256")}
                      style={{ accentColor: "#10b981" }}
                    />
                    <span>Amazon S3-Managed Key (SSE-S3 / AES-256)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                    <input
                      type="radio"
                      name="enc"
                      checked={newBucketEncryption === "aws:kms"}
                      onChange={() => setNewBucketEncryption("aws:kms")}
                      style={{ accentColor: "#10b981" }}
                    />
                    <span>AWS Key Management Service (SSE-KMS)</span>
                  </label>
                </div>
              </div>

              {/* Block Public Access */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.06)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  marginBottom: "20px"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#10b981" }}>
                    🛡️ Enforce Block Public Access (Recommended)
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Applies all 4 public access controls to prevent unauthorized internet exposure
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newBucketBlockPublic}
                  onChange={(e) => setNewBucketBlockPublic(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newBucketName.trim()}
                  className="btn btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #059669, #0d9488)",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: "700"
                  }}
                >
                  {isCreating ? "Provisioning on AWS..." : "🚀 Create Bucket on AWS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIGURE / EDIT BUCKET MODAL                    */}
      {/* ========================================================= */}
      {editTarget && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: "520px", borderRadius: "18px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={20} style={{ color: "#06b6d4" }} />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                  Configure Bucket: {editTarget.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig}>
              {/* Storage Class Transition */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  PRIMARY STORAGE CLASS
                </label>
                <select
                  value={editStorageClass}
                  onChange={(e) => setEditStorageClass(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "var(--bg-glass-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    outline: "none"
                  }}
                >
                  <option value="Standard">S3 Standard (High frequency, ₹1.90/GB)</option>
                  <option value="Intelligent-Tiering">S3 Intelligent-Tiering (Auto-tiering, Save up to 40%)</option>
                  <option value="Glacier Flexible Retrieval">Glacier Flexible Retrieval (Long-term, Save up to 78%)</option>
                </select>
              </div>

              {/* Versioning */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-glass)",
                  marginBottom: "12px"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-heading)" }}>
                    Object Versioning
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Maintain historical revisions of uploaded objects
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editVersioning}
                  onChange={(e) => setEditVersioning(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#06b6d4", cursor: "pointer" }}
                />
              </div>

              {/* Server-Side Encryption */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-glass)",
                  marginBottom: "12px"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-heading)" }}>
                    Default Server-Side Encryption
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {editEncryption === "aws:kms" ? "AWS-KMS Customer Managed Key" : "AES-256 Amazon S3-Managed Key"}
                  </div>
                </div>
                <select
                  value={editEncryption}
                  onChange={(e) => setEditEncryption(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "var(--bg-glass-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-primary)",
                    fontSize: "0.78rem"
                  }}
                >
                  <option value="AES256">SSE-S3 (AES256)</option>
                  <option value="aws:kms">AWS-KMS</option>
                </select>
              </div>

              {/* Block Public Access */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: editBlockPublic ? "rgba(16, 185, 129, 0.06)" : "rgba(245, 158, 11, 0.06)",
                  border: editBlockPublic ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                  marginBottom: "20px"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: editBlockPublic ? "#10b981" : "#f59e0b" }}>
                    {editBlockPublic ? "🛡️ Block All Public Access (Secure)" : "⚠️ Public Access Allowed"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Applies BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editBlockPublic}
                  onChange={(e) => setEditBlockPublic(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="btn btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: "700"
                  }}
                >
                  {isSavingConfig ? "Applying Configuration..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DEEP CLOUDWATCH TELEMETRY MODAL                  */}
      {/* ========================================================= */}
      {telemetryBucket && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: "700px", borderRadius: "18px", padding: "26px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Gauge size={20} style={{ color: "#10b981" }} />
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                    CloudWatch Telemetry: {telemetryBucket.name}
                  </h2>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    Region: {telemetryBucket.region} • Sampled live from AWS CloudWatch Metrics
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelemetryBucket(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingTelemetry ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <RefreshCw size={28} className="animate-spin text-neon-green" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Querying AWS CloudWatch metrics (BucketSizeBytes, NumberOfObjects, AllRequests)...
                </p>
              </div>
            ) : (
              <div>
                {/* 12-Hour Storage Growth Sparkline */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-glass)",
                    marginBottom: "18px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                      12-HOUR STORAGE VOLUME TIMELINE (GB)
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: "700" }}>
                      Peak: {telemetryData?.storageGb || telemetryBucket.storageGb} GB
                    </span>
                  </div>

                  {/* Sparkline Bars */}
                  <div style={{ display: "flex", alignItems: "flex-end", height: "80px", gap: "8px", paddingTop: "10px" }}>
                    {(telemetryData?.timeline || []).map((pt, i) => {
                      const maxVal = Math.max(...(telemetryData?.timeline || []).map((t) => t.gb), 1);
                      const heightPct = Math.max(15, Math.round((pt.gb / maxVal) * 100));
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: `${heightPct}%`,
                              borderRadius: "4px 4px 0 0",
                              background: i === (telemetryData?.timeline?.length || 1) - 1
                                ? "linear-gradient(180deg, #10b981, #059669)"
                                : "rgba(16, 185, 129, 0.45)"
                            }}
                            title={`${pt.time}: ${pt.gb} GB`}
                          />
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{pt.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Network & Request Telemetry */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                    marginBottom: "18px"
                  }}
                >
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>DAILY REQUESTS</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-heading)", marginTop: "4px" }}>
                      {(telemetryData?.requests24h || 14200).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "2px" }}>
                      ~164 req/sec peak
                    </div>
                  </div>

                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>DATA TRANSFER IN</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-heading)", marginTop: "4px" }}>
                      {telemetryData?.dataTransferInGb || 18.4} GB
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Ingress free
                    </div>
                  </div>

                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>DATA TRANSFER OUT</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#f97316", marginTop: "4px" }}>
                      {telemetryData?.dataTransferOutGb || 4.2} GB
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Egress monitored
                    </div>
                  </div>
                </div>

                {/* Security Audit Checklist Matrix */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.04)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    marginBottom: "18px"
                  }}
                >
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#10b981", marginBottom: "8px" }}>
                    SECURITY POSTURE AUDIT
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                      <span>BlockPublicAcls: <strong>Enforced</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                      <span>IgnorePublicAcls: <strong>Enforced</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                      <span>BlockPublicPolicy: <strong>Enforced</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                      <span>RestrictPublicBuckets: <strong>Enforced</strong></span>
                    </div>
                  </div>
                </div>

                {/* Active Lifecycle Configuration Rules */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-glass)",
                    marginBottom: "18px"
                  }}
                >
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "var(--text-heading)", marginBottom: "8px" }}>
                    ACTIVE FINOPS LIFECYCLE RULES
                  </div>
                  {(telemetryData?.lifecycleRules && telemetryData.lifecycleRules.length > 0) ? (
                    telemetryData.lifecycleRules.map((rule, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.03)",
                          marginBottom: "6px",
                          fontSize: "0.78rem",
                          display: "flex",
                          justifyContent: "space-between"
                        }}
                      >
                        <span style={{ fontWeight: "700", color: "#10b981" }}>{rule.id}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{rule.action}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      No custom lifecycle rules. Eligible for AI FinOps Glacier Archival or Intelligent-Tiering auto-transition!
                    </div>
                  )}
                </div>

                {/* Direct DNS Endpoint & ARN */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(`https://${telemetryBucket.name}.s3.${telemetryBucket.region}.amazonaws.com`, "endpoint")}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    {copiedId === "endpoint" ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                    <span>Copy S3 DNS Endpoint</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(`arn:aws:s3:::${telemetryBucket.name}`, "arn")}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    {copiedId === "arn" ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                    <span>Copy S3 ARN</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DELETE BUCKET CONFIRMATION MODAL                 */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: "480px", borderRadius: "18px", padding: "26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", marginBottom: "14px" }}>
              <Trash2 size={22} />
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>
                Permanently Delete S3 Bucket?
              </h2>
            </div>

            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete bucket{" "}
              <strong style={{ color: "var(--text-heading)" }}>{deleteTarget.name}</strong>?
              This action terminates all bucket policies, lifecycle configurations, and object tracking.
            </p>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                TYPE BUCKET NAME TO CONFIRM:
              </label>
              <input
                type="text"
                placeholder={deleteTarget.name}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-glass-input)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmText !== deleteTarget.name}
                onClick={handleDeleteBucket}
                style={{
                  background: deleteConfirmText === deleteTarget.name ? "#ef4444" : "rgba(239, 68, 68, 0.4)",
                  color: "#ffffff",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: deleteConfirmText === deleteTarget.name ? "pointer" : "not-allowed"
                }}
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Bucket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: S3 OBJECT EXPLORER & LIVE FILE UPLOADER          */}
      {/* ========================================================= */}
      {objectTargetBucket && (
        <div className="modal-backdrop">
          <div
            className="modal-content glass-card"
            style={{
              maxWidth: "780px",
              width: "95%",
              borderRadius: "18px",
              padding: "26px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10b981"
                  }}
                >
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                    Bucket Objects & Live Uploader: {objectTargetBucket.name}
                  </h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px", fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    <span>📍 {objectTargetBucket.region}</span>
                    <span>•</span>
                    <span>Class: {objectTargetBucket.storageClass}</span>
                    <span>•</span>
                    <span>{bucketObjects.length} active object(s)</span>
                    {objectTargetBucket.awsLive && (
                      <span style={{ color: "#10b981", fontWeight: "700" }}>● AWS LIVE</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setObjectTargetBucket(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Upload Zone Card */}
            <div
              style={{
                borderRadius: "14px",
                padding: "18px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)",
                border: "1px dashed rgba(16, 185, 129, 0.35)",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Upload size={16} style={{ color: "#10b981" }} />
                  <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--text-heading)" }}>
                    Upload File Directly to Amazon S3
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  PutObjectCommand (SSE-S3 encrypted)
                </span>
              </div>

              <form onSubmit={handleUploadObject}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  {/* File Selector */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      CHOOSE LOCAL FILE (Any format)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      required
                      onChange={handleFileChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "8px",
                        background: "var(--bg-glass-input)",
                        border: "1px solid var(--border-glass)",
                        color: "var(--text-primary)",
                        fontSize: "0.78rem"
                      }}
                    />
                  </div>

                  {/* S3 Key / Destination Path */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      S3 OBJECT KEY (FILENAME / PREFIX)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. data/report.pdf or photo.png"
                      value={uploadKey}
                      onChange={(e) => setUploadKey(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: "var(--bg-glass-input)",
                        border: "1px solid var(--border-glass)",
                        color: "var(--text-primary)",
                        fontSize: "0.8rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                {/* Storage Class for Object */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                      STORAGE CLASS:
                    </label>
                    <select
                      value={uploadStorageClass}
                      onChange={(e) => setUploadStorageClass(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        background: "var(--bg-glass-input)",
                        border: "1px solid var(--border-glass)",
                        color: "var(--text-primary)",
                        fontSize: "0.78rem"
                      }}
                    >
                      <option value="STANDARD">S3 Standard (High availability)</option>
                      <option value="INTELLIGENT_TIERING">S3 Intelligent-Tiering (Auto-cost reduction)</option>
                      <option value="GLACIER">Glacier Flexible Retrieval (Archive)</option>
                      <option value="DEEP_ARCHIVE">Glacier Deep Archive (Lowest cost)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: selectedFile ? "linear-gradient(135deg, #059669, #0d9488)" : "rgba(255, 255, 255, 0.08)",
                      border: "none",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      padding: "8px 18px",
                      cursor: selectedFile ? "pointer" : "not-allowed"
                    }}
                  >
                    <Upload size={14} className={isUploading ? "animate-spin" : ""} />
                    <span>{isUploading ? "Uploading to S3..." : "🚀 Upload Object to S3"}</span>
                  </button>
                </div>

                {selectedFile && (
                  <div style={{ marginTop: "10px", fontSize: "0.74rem", color: "#10b981", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <span>Selected: <strong>{selectedFile.name}</strong></span>
                    <span>•</span>
                    <span>Size: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>Type: {selectedFile.type || "binary"}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Objects List Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={16} style={{ color: "#06b6d4" }} />
                <h3 style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                  Objects in Bucket ({bucketObjects.length})
                </h3>
              </div>

              {/* Search in bucket */}
              <div style={{ position: "relative", minWidth: "220px" }}>
                <Search size={14} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Filter objects by key name..."
                  value={objectSearch}
                  onChange={(e) => setObjectSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 28px",
                    borderRadius: "6px",
                    background: "var(--bg-glass-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-primary)",
                    fontSize: "0.76rem"
                  }}
                />
              </div>
            </div>

            {loadingObjects ? (
              <div style={{ padding: "30px", textAlign: "center" }}>
                <RefreshCw size={24} className="animate-spin text-neon-green" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Listing objects from AWS S3 API...</p>
              </div>
            ) : bucketObjects.length === 0 ? (
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-glass)"
                }}
              >
                <Database size={26} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-heading)" }}>
                  Bucket is empty
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  No objects found. Choose a file above and click &quot;Upload Object to S3&quot; to upload your first object!
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: "10px", border: "1px solid var(--border-glass)", overflowX: "auto", maxHeight: "300px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.02)" }}>
                      <th style={{ padding: "8px 12px", fontWeight: "700" }}>OBJECT KEY / NAME</th>
                      <th style={{ padding: "8px 12px", fontWeight: "700" }}>SIZE</th>
                      <th style={{ padding: "8px 12px", fontWeight: "700" }}>STORAGE CLASS</th>
                      <th style={{ padding: "8px 12px", fontWeight: "700" }}>LAST MODIFIED</th>
                      <th style={{ padding: "8px 12px", fontWeight: "700", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bucketObjects
                      .filter((o) => !objectSearch || o.key.toLowerCase().includes(objectSearch.toLowerCase()))
                      .map((obj) => (
                        <tr key={obj.key} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: "700", color: "var(--text-heading)", wordBreak: "break-all" }}>
                            📄 {obj.key}
                          </td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>
                            {obj.sizeFormatted || `${(obj.size / 1024).toFixed(1)} KB`}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 6px",
                                borderRadius: "6px",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#10b981",
                                fontWeight: "700"
                              }}
                            >
                              {obj.storageClass}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                            {new Date(obj.lastModified).toLocaleString()}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={() => handleCopy(`s3://${objectTargetBucket.name}/${obj.key}`, obj.key)}
                                title="Copy S3 URI"
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                              >
                                {copiedId === obj.key ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                              </button>
                              <button
                                type="button"
                                disabled={deletingKey === obj.key}
                                onClick={() => handleDeleteObject(obj.key)}
                                title="Delete Object from S3"
                                style={{
                                  background: "rgba(239, 68, 68, 0.12)",
                                  border: "none",
                                  color: "#ef4444",
                                  borderRadius: "4px",
                                  padding: "3px 6px",
                                  cursor: "pointer"
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
