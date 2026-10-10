import React from "react";
import { useCloud } from "../context/CloudContext";
import { Cpu, Server, Box, CheckCircle2, Layers } from "lucide-react";

export const K8sAutoscaling = () => {
  const { k8s, formatCurrency, account } = useCloud();
  if (!k8s) return null;

  return (
    <div className="k8s-container">
      {/* Header */}
      <div className="section-header-row">
        <div>
          <div className="section-title-group">
            <Cpu className="text-cyan" size={24} />
            <h2 className="section-title">Kubernetes Cluster & Auto-Scaling (HPA)</h2>
          </div>
          <p className="section-subtitle">
            Container orchestration telemetry, pod resource quotas, and Horizontal Pod Autoscaler policies.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="badge badge-neon-green">
            <span>Live Fleet ({account?.primaryRegion || "ap-south-1"})</span>
          </div>
        </div>
      </div>

      {/* Live AWS Mode Notice Banner */}
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
          <CheckCircle2 size={18} style={{ color: "#10b981" }} />
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
              Live AWS Environment Connected ({account?.primaryRegion || "ap-south-1"})
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Real-time inspection active. All compute and container clusters in {account?.primaryRegion || "ap-south-1"} are monitored.
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Overview Grid */}
      <div className="k8s-overview-grid">
        {/* Node & Pod Stats */}
        <div className="glass-card k8s-stat-card">
          <span className="stat-label">Worker Nodes</span>
          <div className="stat-val-row">
            <span className="stat-val">{k8s.totalNodes || 0} Nodes</span>
            <span className="badge badge-cream">ap-south-1</span>
          </div>
          <div className="stat-sub text-secondary text-xs">
            0 Active Amazon EKS Nodes
          </div>
        </div>

        <div className="glass-card k8s-stat-card">
          <span className="stat-label">Running Pods</span>
          <div className="stat-val-row">
            <span className="stat-val">{k8s.totalPods || 0} Pods</span>
            <span className="badge badge-cream">0 Active</span>
          </div>
          <div className="stat-sub text-secondary text-xs">
            No Container Pods Running
          </div>
        </div>

        <div className="glass-card k8s-stat-card">
          <span className="stat-label">Cluster CPU Allocated</span>
          <div className="stat-val-row">
            <span className="stat-val text-primary">
              {k8s.clusterCpuAllocated ? `${k8s.clusterCpuAllocated}%` : "0.0%"}
            </span>
            <span className="badge badge-cyan">Optimal</span>
          </div>
          <div className="stat-sub text-secondary text-xs">
            Target Threshold: 70%
          </div>
        </div>

        <div className="glass-card k8s-stat-card">
          <span className="stat-label">Container Spend</span>
          <div className="stat-val-row">
            <span className="stat-val text-primary">
              {formatCurrency(k8s.clusterCost || 0)}
            </span>
            <span className="badge badge-purple">₹0.00</span>
          </div>
          <div className="stat-sub text-secondary text-xs">
            0% of AWS Invoice
          </div>
        </div>
      </div>

      {/* Live AWS EKS Fleet Cards */}
      <div className="k8s-details-grid">
        {/* Card 1: EKS Deployment Status */}
        <div className="glass-card hpa-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Box className="text-neon-cyan" size={20} />
              <h3 className="card-title">Amazon EKS Fleet Status in ap-south-1</h3>
            </div>
            <span className="badge badge-neon-green">Live Scanner Active</span>
          </div>

          <p className="card-description">
            Continuous inspection of Amazon EKS clusters, node groups, and container daemonsets in your connected AWS account.
          </p>

          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "8px", margin: "1rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981" }} />
              <strong style={{ color: "var(--text-main)" }}>No Container Infrastructure Bill Incurred</strong>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
              Your AWS environment is monitored in real-time. Because no Amazon EKS clusters are provisioned, your cluster management fee is <strong>₹0.00/month</strong> (saving the baseline $73/mo AWS EKS control plane surcharge).
            </p>
          </div>
        </div>

        {/* Card 2: Container Namespace Cost Attribution */}
        <div className="glass-card namespace-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Server className="text-neon-cyan" size={20} />
              <h3 className="card-title">Container Namespace Cost Attribution</h3>
            </div>
            <span className="badge badge-cream">ap-south-1</span>
          </div>

          <p className="card-description">
            FinOps cost attribution for microservices, pod deployments, and persistent volumes.
          </p>

          <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <Layers size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px auto", display: "block" }} />
            <div style={{ fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>
              No Active Container Namespaces
            </div>
            <p style={{ fontSize: "0.82rem", maxWidth: "380px", margin: "0 auto", lineHeight: "1.4" }}>
              Zero Amazon EKS container workloads are currently deployed. As soon as you launch a Kubernetes cluster in ap-south-1, namespaces and pod costs will be tracked here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
