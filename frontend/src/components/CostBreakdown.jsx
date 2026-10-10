import React from "react";
import { useCloud } from "../context/CloudContext";
import { Server, Database, HardDrive, Cpu, PieChart, ArrowUpRight, CheckCircle2 } from "lucide-react";

export const CostBreakdown = () => {
  const { summary, formatCurrency, setActiveTab, mode, account } = useCloud();

  if (!summary) return null;

  const { costBreakdown = {}, monthlyCost = 0, historicalTrend = [] } = summary || {};
  const ec2Cost = costBreakdown?.EC2 ?? 0;
  const rdsCost = costBreakdown?.RDS ?? 0;
  const s3Cost = costBreakdown?.S3 ?? 0;
  const otherCost = costBreakdown?.Other ?? 0;

  const totalCost = monthlyCost > 0 ? monthlyCost : (ec2Cost + rdsCost + s3Cost + otherCost);

  const ec2Pct = totalCost > 0 ? Math.round((ec2Cost / totalCost) * 100) : 0;
  const rdsPct = totalCost > 0 ? Math.round((rdsCost / totalCost) * 100) : 0;
  const s3Pct = totalCost > 0 ? Math.round((s3Cost / totalCost) * 100) : 0;
  const otherPct = totalCost > 0 ? Math.max(0, 100 - (ec2Pct + rdsPct + s3Pct)) : 0;

  // Max historical value for chart scaling
  const maxHistory = Math.max(...(historicalTrend || []).map((h) => h.cost), 22000);
  const firstCost = (historicalTrend && historicalTrend.length > 0) ? historicalTrend[0].cost : 0;
  const currentCost = (historicalTrend && historicalTrend.length > 0) ? historicalTrend[historicalTrend.length - 1].cost : totalCost;
  const trendGrowth = firstCost > 0 ? Math.round(((currentCost - firstCost) / firstCost) * 100) : 14;

  return (
    <div className="analytics-split-grid">
      {/* Service Cost Breakdown Card */}
      <div className="glass-card service-breakdown-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <PieChart className="text-neon-cyan" size={20} />
            <h3 className="card-title">AWS Service Cost Breakdown</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {mode === "LIVE_AWS" && (
              <span className="badge badge-neon-green" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                Live AWS
              </span>
            )}
            <span className="badge badge-cream">{formatCurrency(totalCost)} Total</span>
          </div>
        </div>

        <p className="card-description">
          Monthly expenditure grouped by AWS infrastructure services.
        </p>

        {/* Stacked Visual Bar */}
        <div className="stacked-cost-bar">
          <div
            className="bar-segment bar-ec2"
            style={{ width: `${ec2Pct}%` }}
            title={`EC2: ${formatCurrency(ec2Cost)} (${ec2Pct}%)`}
          />
          <div
            className="bar-segment bar-rds"
            style={{ width: `${rdsPct}%` }}
            title={`RDS: ${formatCurrency(rdsCost)} (${rdsPct}%)`}
          />
          <div
            className="bar-segment bar-s3"
            style={{ width: `${s3Pct}%` }}
            title={`S3: ${formatCurrency(s3Cost)} (${s3Pct}%)`}
          />
          <div
            className="bar-segment bar-other"
            style={{ width: `${otherPct}%` }}
            title={`Other: ${formatCurrency(otherCost)} (${otherPct}%)`}
          />
        </div>

        {/* Breakdown Items List */}
        <div className="service-items-list">
          {/* EC2 */}
          <div
            className="service-cost-item"
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("ec2")}
            title="Click to open EC2 Live Operations Hub"
          >
            <div className="service-info-left">
              <div className="service-icon-circle bg-cream-subtle text-cream">
                <Server size={16} />
              </div>
              <div>
                <div className="service-name">Amazon EC2 (Compute) ➔</div>
                <div className="service-meta">Instances & Autoscaling Groups</div>
              </div>
            </div>
            <div className="service-cost-right">
              <span className="service-cost-val">{formatCurrency(ec2Cost)}</span>
              <span className="service-cost-pct text-cream">{ec2Pct}%</span>
            </div>
          </div>

          {/* RDS */}
          <div className="service-cost-item">
            <div className="service-info-left">
              <div className="service-icon-circle bg-green-subtle text-neon-green">
                <Database size={16} />
              </div>
              <div>
                <div className="service-name">Amazon RDS (Database)</div>
                <div className="service-meta">Aurora PostgreSQL & Replicas</div>
              </div>
            </div>
            <div className="service-cost-right">
              <span className="service-cost-val">{formatCurrency(rdsCost)}</span>
              <span className="service-cost-pct text-neon-green">{rdsPct}%</span>
            </div>
          </div>

          {/* S3 */}
          <div
            className="service-cost-item"
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("s3")}
            title="Click to open S3 Storage Operations Hub"
          >
            <div className="service-info-left">
              <div className="service-icon-circle bg-cyan-subtle text-neon-cyan">
                <HardDrive size={16} />
              </div>
              <div>
                <div className="service-name">Amazon S3 (Storage) ➔</div>
                <div className="service-meta">Buckets, Snapshots & Requests</div>
              </div>
            </div>
            <div className="service-cost-right">
              <span className="service-cost-val">{formatCurrency(s3Cost)}</span>
              <span className="service-cost-pct text-neon-cyan">{s3Pct}%</span>
            </div>
          </div>

          {/* Other */}
          <div className="service-cost-item">
            <div className="service-info-left">
              <div className="service-icon-circle bg-amber-subtle text-neon-amber">
                <Cpu size={16} />
              </div>
              <div>
                <div className="service-name">Other (Lambda / EKS / NAT)</div>
                <div className="service-meta">Serverless, K8s Pods, Data Egress</div>
              </div>
            </div>
            <div className="service-cost-right">
              <span className="service-cost-val">{formatCurrency(otherCost)}</span>
              <span className="service-cost-pct text-neon-amber">{otherPct}%</span>
            </div>
          </div>
        </div>

        {/* Live AWS Connection Status Badge */}
        {mode === "LIVE_AWS" && (
          <div
            className="glass-panel"
            style={{
              marginTop: "1.25rem",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.82rem", fontWeight: "600" }}>
              <CheckCircle2 size={16} />
              <span>Real-Time AWS Telemetry Active ({account?.primaryRegion || "Multi-Region"})</span>
            </div>
            <p style={{ margin: "4px 0 0 24px", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              {totalCost === 0
                ? "Your AWS IAM connection is verified! 0 billable EC2 instances or S3 buckets are currently active in scanned regions. As soon as you launch resources, CloudOptix will track costs and generate rightsizing recommendations here."
                : `Currently tracking ${summary.activeResources} active AWS resource${summary.activeResources === 1 ? "" : "s"} in real-time.`}
            </p>
          </div>
        )}
      </div>

      {/* Historical Spend Trend */}
      <div className="glass-card historical-trend-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <ArrowUpRight className="text-neon-green" size={20} />
            <h3 className="card-title">6-Month Historical Spend Trajectory</h3>
          </div>
          <button
            className="btn btn-ghost btn-sm text-neon-green font-bold"
            onClick={() => setActiveTab("forecast")}
          >
            View AI 90-Day Forecast &rarr;
          </button>
        </div>

        <p className="card-description">
          Tracking monthly billing trends across AWS services prior to FinOps rightsizing.
        </p>

        {/* Trend Bar Chart */}
        <div className="historical-chart-container">
          <div className="chart-bars-row">
            {(historicalTrend || []).map((item, idx) => {
              const heightPct = Math.round((item.cost / maxHistory) * 100);
              const isCurrent = idx === historicalTrend.length - 1;
              return (
                <div key={idx} className="chart-bar-col">
                  <div className="chart-bar-tooltip font-mono">
                    {formatCurrency(item.cost)}
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar-fill ${isCurrent ? "current-month" : ""}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`chart-bar-label ${isCurrent ? "text-neon-green font-bold" : "text-secondary"}`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight callout banner */}
        <div className="spend-insight-banner glass-panel">
          <div className={`insight-icon ${totalCost === 0 ? "text-neon-green" : "text-neon-amber"}`}>
            {totalCost === 0 ? "✓" : "⚠"}
          </div>
          <div className="insight-text">
            {totalCost === 0 ? (
              <span>
                <strong>Cost Posture Optimal:</strong> All compute and storage services are closed or stopped. Ongoing monthly run-rate is <strong>₹0</strong> with zero idle leakage.
              </span>
            ) : (
              <span>
                <strong>Spending Trajectory:</strong> AWS spend grew by <strong>+{trendGrowth}%</strong> over
                the last 6 months based on historical run-rate before FinOps rightsizing interventions.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
