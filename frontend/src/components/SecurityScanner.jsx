import React from "react";
import { useCloud } from "../context/CloudContext";
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

export const SecurityScanner = () => {
  const { security, mode, account } = useCloud();

  const passedCount = security.filter((s) => s.passed).length;
  const failedCount = security.length - passedCount;

  return (
    <div className="security-container">
      {/* Header */}
      <div className="section-header-row">
        <div>
          <div className="section-title-group">
            <ShieldCheck className="text-cyan" size={24} />
            <h2 className="section-title">Cloud Security & Compliance Governance</h2>
          </div>
          <p className="section-subtitle">
            Automated compliance scanner evaluating AWS Well-Architected Framework security controls.
          </p>
        </div>
        <div className="security-score-badge">
          <span className="badge badge-emerald">{passedCount} Passed</span>
          {failedCount > 0 && <span className="badge badge-rose">{failedCount} Action Required</span>}
        </div>
      </div>

      {/* Live AWS Audit Banner */}
      {mode === "LIVE_AWS" && (
        <div
          className="glass-panel"
          style={{
            marginBottom: "1.25rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={18} style={{ color: "#10b981" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                Live AWS Compliance Scan Active ({account?.primaryRegion || "ap-south-1"})
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Auditing live EC2 security group ingress rules, EBS KMS disk encryption, and S3 Block Public Access configurations.
              </div>
            </div>
          </div>
          <span className="badge badge-neon-green" style={{ fontSize: "0.72rem" }}>Live AWS Audit</span>
        </div>
      )}

      {/* Security Checks List */}
      <div className="security-checks-list">
        {security.map((chk) => {
          const isPassed = chk.passed;

          return (
            <div
              key={chk.id}
              className={`glass-card security-card ${isPassed ? "border-subtle" : "border-rose-glow"}`}
            >
              <div className="security-card-header">
                <div className="security-title-col">
                  <div className="security-icon-row">
                    {isPassed ? (
                      <CheckCircle2 className="text-emerald" size={20} />
                    ) : (
                      <ShieldAlert className="text-rose" size={20} />
                    )}
                    <h3 className="security-rule-title">{chk.rule}</h3>
                  </div>
                </div>

                <div className="security-status-col">
                  <span className={`badge ${isPassed ? "badge-emerald" : "badge-rose"}`}>
                    {isPassed ? "COMPLIANT" : "NON-COMPLIANT"}
                  </span>
                  <span className="badge badge-purple text-xs font-mono">{chk.id}</span>
                </div>
              </div>

              {/* Affected Resources (if failed) */}
              {!isPassed && chk.affectedResources?.length > 0 && (
                <div className="affected-resources-box glass-panel">
                  <span className="text-rose text-xs font-semibold">Affected Resources:</span>
                  <div className="affected-tags">
                    {chk.affectedResources.map((res, i) => (
                      <span key={i} className="badge badge-rose font-mono text-xs">
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="security-rec-row">
                <span className="text-muted text-xs font-semibold">Remediation:</span>
                <p className="text-secondary text-xs">{chk.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
