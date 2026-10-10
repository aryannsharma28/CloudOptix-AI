import React from "react";
import { useCloud } from "../context/CloudContext";
import {
  DollarSign,
  TrendingUp,
  Server,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Radio
} from "lucide-react";

export const MetricCards = () => {
  const { summary, recommendations, formatCurrency, isLiveStreaming } = useCloud();

  if (!summary) return null;

  const pendingRecs = recommendations?.filter((r) => !r.applied).length ?? 0;
  const savingsPct = summary.monthlyCost > 0
    ? Math.round(((summary.potentialSavings || 0) / summary.monthlyCost) * 100)
    : 0;

  return (
    <div className="metrics-grid">
      {/* 1. Live Incurred Spend (To-Date) - EXACT START DATE CALCULATION */}
      <div className="metric-card glass-card border-emerald-glow">
        <div className="metric-header">
          <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Live Incurred Spend (To-Date)</span>
          </span>
          <div className="metric-icon-box text-neon-green">
            <Clock size={20} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-neon-green" style={{ fontFamily: "monospace" }}>
            {formatCurrency(summary.incurredSpendToDate || 0, true)}
          </span>
          <span
            className="badge badge-neon-green"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
                animation: isLiveStreaming ? "pulse 1.5s infinite" : "none"
              }}
            />
            <span>{isLiveStreaming ? "Live Tracking" : "Stream Paused"}</span>
          </span>
        </div>
        <div className="metric-footer">
          <span className="text-secondary text-xs">
            Calculated from exact service start dates • Zero Day-1 assumptions
          </span>
        </div>
      </div>

      {/* 2. Projected Monthly Spend */}
      <div className="metric-card glass-card">
        <div className="metric-header">
          <span className="metric-label">Projected Month Spend</span>
          <div className="metric-icon-box text-cream">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value">{formatCurrency(summary.monthlyCost)}</span>
          <span className="badge badge-cream">Current Run-rate</span>
        </div>
        <div className="metric-footer">
          <span className="text-secondary text-xs">
            Pro-rated run rate based on start dates & remaining month hours
          </span>
        </div>
      </div>

      {/* 3. Estimated Next Month */}
      <div className="metric-card glass-card border-warning-glow">
        <div className="metric-header">
          <span className="metric-label">Estimated Next Month</span>
          <div className="metric-icon-box text-neon-amber">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-neon-amber">
            {formatCurrency(summary.estimatedNextMonth)}
          </span>
          {summary.monthlyCost > 0 ? (
            <span className="trend-pill trend-up">
              <ArrowUpRight size={14} />
              <span>
                +{Math.round(((summary.estimatedNextMonth - summary.monthlyCost) / summary.monthlyCost) * 100)}% Forecast
              </span>
            </span>
          ) : (
            <span className="badge badge-cream">
              <span>Baseline Run-rate</span>
            </span>
          )}
        </div>
        <div className="metric-footer">
          <span className="text-secondary text-xs">
            ML Autoregressive forecast without FinOps rightsizing
          </span>
        </div>
      </div>

      {/* 4. Active Fleet & Underutilized */}
      <div className="metric-card glass-card">
        <div className="metric-header">
          <span className="metric-label">Active Cloud Fleet</span>
          <div className="metric-icon-box text-neon-cyan">
            <Server size={20} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value">{summary.activeResources}</span>
          <span className="badge badge-neon-cyan">
            <CheckCircle2 size={12} /> Live Monitored
          </span>
        </div>
        <div className="metric-footer">
          <span className="text-secondary text-xs">
            Across EC2, RDS, S3, EBS, and Lambda in ap-south-1
          </span>
        </div>
      </div>

      {/* 5. Potential Monthly Savings */}
      <div className="metric-card glass-card border-emerald-glow">
        <div className="metric-header">
          <span className="metric-label">Potential Monthly Savings</span>
          <div className="metric-icon-box text-neon-green">
            <Zap size={20} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-neon-green">
            {formatCurrency(summary.potentialSavings)}
          </span>
          <span className="badge badge-neon-green">
            {savingsPct > 0 ? `${savingsPct}% Reduction` : "Optimized"}
          </span>
        </div>
        <div className="metric-footer">
          <span className="text-secondary text-xs">
            {pendingRecs > 0
              ? `Achievable by applying ${pendingRecs} pending rightsizing recommendation${pendingRecs === 1 ? "" : "s"}`
              : "All identified optimization recommendations applied"}
          </span>
        </div>
      </div>
    </div>
  );
};
