import React, { useState, useMemo } from "react";
import { useCloud } from "../context/CloudContext";
import {
  X,
  Server,
  Database,
  HardDrive,
  Cpu,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  Info,
  ShieldCheck
} from "lucide-react";

export const EnableServiceModal = () => {
  const { isEnableModalOpen, setIsEnableModalOpen, enableService, formatCurrency } = useCloud();

  const [service, setService] = useState("EC2");
  const [name, setName] = useState("");
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [dateMode, setDateMode] = useState("custom"); // "now" | "custom"
  
  // Default custom date to 2 days ago to demonstrate immediate non-Day-1 calculation
  const defaultPastDate = useMemo(() => {
    const d = new Date(Date.now() - 48 * 3600 * 1000);
    // Format YYYY-MM-DDTHH:MM
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  const [customDateTime, setCustomDateTime] = useState(defaultPastDate);
  const [cpuUtilization, setCpuUtilization] = useState(32.5);
  const [submitting, setSubmitting] = useState(false);

  if (!isEnableModalOpen) return null;

  // Pricing specs per service
  const serviceOptions = {
    EC2: [
      { id: "t3.nano", label: "t3.nano (2 vCPU, 0.5 GB) — ₹440/mo (~₹0.60/hr)", monthly: 440 },
      { id: "t3.micro", label: "t3.micro (2 vCPU, 1 GB) — ₹880/mo (~₹1.21/hr)", monthly: 880 },
      { id: "t3.small", label: "t3.small (2 vCPU, 2 GB) — ₹1,760/mo (~₹2.41/hr)", monthly: 1760 },
      { id: "t3.medium", label: "t3.medium (2 vCPU, 4 GB) — ₹3,520/mo (~₹4.82/hr)", monthly: 3520 },
      { id: "m5.large", label: "m5.large (2 vCPU, 8 GB) — ₹7,900/mo (~₹10.82/hr)", monthly: 7900 }
    ],
    S3: [
      { id: "s3-standard", label: "S3 Standard Tier (Object Storage) — ₹650/mo base (~₹0.89/hr)", monthly: 650 },
      { id: "s3-glacier", label: "S3 Glacier Flexible Retrieval — ₹120/mo base (~₹0.16/hr)", monthly: 120 }
    ],
    RDS: [
      { id: "db.t3.micro", label: "db.t3.micro PostgreSQL / MySQL — ₹1,450/mo (~₹1.99/hr)", monthly: 1450 },
      { id: "db.t3.small", label: "db.t3.small PostgreSQL / MySQL — ₹2,900/mo (~₹3.97/hr)", monthly: 2900 },
      { id: "db.m5.large", label: "db.m5.large Production Multi-AZ — ₹9,800/mo (~₹13.42/hr)", monthly: 9800 }
    ],
    EBS: [
      { id: "gp3", label: "General Purpose SSD (gp3, 100 GB) — ₹650/mo (~₹0.89/hr)", monthly: 650 },
      { id: "gp2", label: "General Purpose SSD (gp2, 100 GB) — ₹820/mo (~₹1.12/hr)", monthly: 820 }
    ],
    Lambda: [
      { id: "lambda-serverless", label: "AWS Lambda Serverless Functions — ₹240/mo (~₹0.33/hr)", monthly: 240 }
    ]
  };

  const selectedSpec = serviceOptions[service]?.find((s) => s.id === instanceType) || serviceOptions[service][0];
  const hourlyRate = Math.round((selectedSpec.monthly / 730) * 100) / 100;

  // Calculate live preview metrics
  const chosenStartDate = dateMode === "now" ? new Date() : new Date(customDateTime || Date.now());
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - chosenStartDate.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const previewIncurred = Math.round((hourlyRate * elapsedHours) * 100) / 100;

  const totalDays = Math.floor(elapsedHours / 24);
  const remHours = Math.floor(elapsedHours % 24);
  const remMins = Math.floor((elapsedMs / (1000 * 60)) % 60);

  const setPreset = (hoursAgo) => {
    setDateMode("custom");
    const d = new Date(Date.now() - hoursAgo * 3600 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    setCustomDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalStartDate = dateMode === "now" ? new Date().toISOString() : new Date(customDateTime).toISOString();
      const payload = {
        service,
        name: name.trim() || `${service.toLowerCase()}-${Math.random().toString(16).substring(2, 6)}`,
        instanceType: selectedSpec.id,
        startedAt: finalStartDate,
        costPerMonth: selectedSpec.monthly,
        cpuUtilization: Number(cpuUtilization)
      };

      const result = await enableService(payload);
      if (result.success) {
        setIsEnableModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsEnableModalOpen(false)}>
      <div
        className="modal-container glass-card"
        style={{ maxWidth: "640px", padding: "1.75rem", borderRadius: "16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Zap className="text-neon-green" size={22} />
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                Enable & Live-Track AWS Service
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Specify the exact date & time when this service was enabled. Live costs & uptime will be tracked from that date, not assumed from Day 1 of the month.
            </p>
          </div>
          <button
            className="btn-icon"
            onClick={() => setIsEnableModalOpen(false)}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Service Selector */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
              AWS Cloud Service
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
              {[
                { id: "EC2", label: "EC2 Compute", icon: <Server size={16} /> },
                { id: "S3", label: "S3 Storage", icon: <HardDrive size={16} /> },
                { id: "RDS", label: "RDS Database", icon: <Database size={16} /> },
                { id: "EBS", label: "EBS Block", icon: <HardDrive size={16} /> },
                { id: "Lambda", label: "Lambda", icon: <Cpu size={16} /> }
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setService(s.id);
                    setInstanceType(serviceOptions[s.id][0].id);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "10px 4px",
                    borderRadius: "10px",
                    border: service === s.id ? "2px solid var(--accent-neon-green, #10b981)" : "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
                    background: service === s.id ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                    color: service === s.id ? "var(--accent-neon-green, #10b981)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: "600"
                  }}
                >
                  {s.icon}
                  <span>{s.id}</span>
                </button>
              ))}
            </div>
            {service === "EC2" && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.78rem",
                  color: "#34d399"
                }}
              >
                <ShieldCheck size={16} />
                <span>
                  <strong>Automatic Live AWS Provisioning:</strong> Automatically issues <code>RunInstances</code> to create instance directly in your AWS EC2 Console with live telemetry!
                </span>
              </div>
            )}
          </div>

          {/* Resource Name & Specs Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", marginBottom: "4px", color: "var(--text-main)" }}>
                Resource Name
              </label>
              <input
                type="text"
                placeholder={service === "EC2" ? "prod-web-server" : service === "S3" ? "app-media-bucket" : "primary-db-instance"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-input, rgba(0,0,0,0.3))",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                  color: "var(--text-main)",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", marginBottom: "4px", color: "var(--text-main)" }}>
                Instance / Storage Spec
              </label>
              <select
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-input, rgba(0,0,0,0.3))",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                  color: "var(--text-main)",
                  fontSize: "0.85rem"
                }}
              >
                {serviceOptions[service]?.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* START DATE & TIME SELECTION SECTION */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              marginBottom: "1rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Clock className="text-neon-green" size={16} />
              <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--text-main)" }}>
                When was this service started / enabled?
              </span>
            </div>

            {/* Mode selection radio */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.84rem", color: "var(--text-main)" }}>
                <input
                  type="radio"
                  name="dateMode"
                  value="now"
                  checked={dateMode === "now"}
                  onChange={() => setDateMode("now")}
                />
                <span>🟢 Start Right Now (Live Stream)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.84rem", color: "var(--text-main)" }}>
                <input
                  type="radio"
                  name="dateMode"
                  value="custom"
                  checked={dateMode === "custom"}
                  onChange={() => setDateMode("custom")}
                />
                <span>📅 Specific Date & Time</span>
              </label>
            </div>

            {/* Custom Date Input & Presets */}
            {dateMode === "custom" && (
              <div>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-input, rgba(0,0,0,0.4))",
                    border: "1px solid var(--border-subtle, rgba(255,255,255,0.2))",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    marginBottom: "8px"
                  }}
                />

                {/* Quick Presets */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "4px" }}>Quick Presets:</span>
                  <button type="button" onClick={() => setPreset(1)} className="btn-chip-preset">1 Hour Ago</button>
                  <button type="button" onClick={() => setPreset(6)} className="btn-chip-preset">6 Hours Ago</button>
                  <button type="button" onClick={() => setPreset(24)} className="btn-chip-preset">Yesterday (24h)</button>
                  <button type="button" onClick={() => setPreset(72)} className="btn-chip-preset">3 Days Ago (72h)</button>
                  <button type="button" onClick={() => setPreset(120)} className="btn-chip-preset">5 Days Ago (120h)</button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Calculation Breakdown Preview */}
          <div
            style={{
              padding: "0.9rem",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              marginBottom: "1.25rem",
              fontSize: "0.82rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "var(--text-muted)" }}>Service Start Timestamp:</span>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                {chosenStartDate.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} IST
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "var(--text-muted)" }}>Calculated Live Uptime:</span>
              <span style={{ fontWeight: "700", color: "var(--accent-neon-green, #10b981)" }}>
                {dateMode === "now" ? "0s (Starting live)" : `${totalDays > 0 ? `${totalDays}d ` : ""}${remHours}h ${remMins}m`}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "var(--text-muted)" }}>Hourly Rate:</span>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                {formatCurrency(hourlyRate, true)} / hour
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px", marginTop: "6px" }}>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                Incurred Spend To-Date (Calculated from Start Date):
              </span>
              <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--accent-neon-green, #10b981)" }}>
                {formatCurrency(previewIncurred, true)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", color: "#38bdf8", fontSize: "0.78rem" }}>
              <Info size={14} />
              <span>
                Calculation strictly measures from your specified start timestamp. Zero charges assumed from Day 1 of the month.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEnableModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "700"
              }}
            >
              <Zap size={16} />
              <span>{submitting ? "Enabling..." : "Launch & Stream Telemetry"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
