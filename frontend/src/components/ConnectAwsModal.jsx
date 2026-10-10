import React, { useState } from "react";
import { useCloud } from "../context/CloudContext";
import {
  Cloud,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Lock,
  Copy,
  FileText,
  Check
} from "lucide-react";

export const ConnectAwsModal = () => {
  const {
    isConnectModalOpen,
    setIsConnectModalOpen,
    mode,
    account,
    connectingAws,
    connectAwsAccount,
    disconnectAwsAccount
  } = useCloud();

  const [tab, setTab] = useState("keys"); // 'keys' | 'role' | 'policy'
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("cloudoptix-finops-production");
  const [region, setRegion] = useState("ap-south-1");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedPolicy, setCopiedPolicy] = useState(false);
  const [policyType, setPolicyType] = useState("compact"); // 'compact' | 'granular'

  if (!isConnectModalOpen) return null;

  const handleConnectKeys = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!accessKeyId.trim() || !secretAccessKey.trim()) {
      setErrorMessage("Please enter both AWS Access Key ID and Secret Access Key.");
      return;
    }

    const res = await connectAwsAccount({
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      region
    });

    if (!res.success) {
      setErrorMessage(res.error || "AWS Authentication failed. Please verify IAM keys.");
    }
  };

  const handleConnectRole = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!roleArn.trim()) {
      setErrorMessage("Please enter the Cross-Account IAM Role ARN.");
      return;
    }

    const res = await connectAwsAccount({
      roleArn: roleArn.trim(),
      externalId: externalId.trim(),
      region
    });

    if (!res.success) {
      setErrorMessage(res.error || "Failed to assume IAM Role.");
    }
  };

  const handleDisconnect = async () => {
    await disconnectAwsAccount();
    setIsConnectModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsConnectModalOpen(false)}>
      <div
        className="modal-card white-box-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "640px",
          width: "92%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ff9900, #ffb84d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}
            >
              <Cloud size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                Connect AWS Account
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                Ingest live CloudWatch metrics, EC2 fleet inventory & Cost Explorer telemetry
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Active Mode Banner */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: mode === "LIVE_AWS" ? "#ecfdf5" : "#f8fafc",
            border: `1px solid ${mode === "LIVE_AWS" ? "#a7f3d0" : "#e2e8f0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {mode === "LIVE_AWS" ? (
              <CheckCircle2 size={20} style={{ color: "#059669" }} />
            ) : (
              <Zap size={20} style={{ color: "#94a3b8" }} />
            )}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                {mode === "LIVE_AWS" ? "Connected to Live AWS Cloud" : "AWS Disconnected / Not Configured"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {mode === "LIVE_AWS"
                  ? `Active Connection • Region: ${account?.primaryRegion || region || "ap-south-1"}`
                  : "No active AWS telemetry connection"}
              </div>
            </div>
          </div>

          {mode === "LIVE_AWS" ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="btn btn-secondary btn-sm"
              style={{
                padding: "6px 14px",
                fontSize: "0.8rem",
                color: "#dc2626",
                fontWeight: "700",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                cursor: "pointer"
              }}
            >
              Disconnect
            </button>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
              Offline
            </span>
          )}
        </div>

        {/* Connection Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "20px",
            paddingBottom: "8px"
          }}
        >
          <button
            onClick={() => { setTab("keys"); setErrorMessage(""); }}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: tab === "keys" ? "var(--aws-navy)" : "#f1f5f9",
              color: tab === "keys" ? "#ffffff" : "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Key size={14} />
            IAM Access Keys
          </button>

          <button
            onClick={() => { setTab("role"); setErrorMessage(""); }}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: tab === "role" ? "var(--aws-navy)" : "#f1f5f9",
              color: tab === "role" ? "#ffffff" : "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ShieldCheck size={14} />
            IAM Role (STS Assume)
          </button>

          <button
            onClick={() => { setTab("policy"); setErrorMessage(""); }}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              background: tab === "policy" ? "var(--aws-navy)" : "#f1f5f9",
              color: tab === "policy" ? "#ffffff" : "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <FileText size={14} />
            IAM Policy (JSON)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px"
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Region Selector (Shared across tabs) */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "6px" }}>
            AWS Primary Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border-light)",
              backgroundColor: "#ffffff",
              color: "var(--text-main)",
              fontSize: "0.9rem"
            }}
          >
            <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
            <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
            <option value="us-west-2">US West (Oregon) - us-west-2</option>
            <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
          </select>
        </div>

        {/* TAB 1: IAM Access Keys */}
        {tab === "keys" && (
          <form onSubmit={handleConnectKeys}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "6px" }}>
                AWS Access Key ID
              </label>
              <input
                type="text"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "#ffffff",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "6px" }}>
                AWS Secret Access Key
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showSecret ? "text" : "password"}
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-light)",
                    backgroundColor: "#ffffff",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    fontFamily: "monospace"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)"
                  }}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Read-Only Security Guarantee */}
            <div
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                display: "flex",
                gap: "8px",
                marginBottom: "20px"
              }}
            >
              <Lock size={16} style={{ color: "#059669", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>FinOps Principle: Read-Only Privilege.</strong> CloudOptix requires only{" "}
                <code style={{ background: "#e2e8f0", padding: "1px 4px", borderRadius: "3px" }}>ec2:Describe*</code>,{" "}
                <code style={{ background: "#e2e8f0", padding: "1px 4px", borderRadius: "3px" }}>cloudwatch:GetMetricData</code>, and{" "}
                <code style={{ background: "#e2e8f0", padding: "1px 4px", borderRadius: "3px" }}>ce:GetCostAndUsage</code>. It cannot destroy or alter any infrastructure.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConnectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={connectingAws}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {connectingAws ? (
                  <>
                    <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Verifying AWS IAM...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Test & Connect AWS</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Cross-Account IAM Role */}
        {tab === "role" && (
          <form onSubmit={handleConnectRole}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "6px" }}>
                Target IAM Role ARN
              </label>
              <input
                type="text"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/CloudOptixFinOpsAuditorRole"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "#ffffff",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "6px" }}>
                STS External ID (for confused-deputy protection)
              </label>
              <input
                type="text"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "#f8fafc",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "20px"
              }}
            >
              <div style={{ fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>
                AWS Best Practice: Cross-Account STS AssumeRole
              </div>
              <p style={{ margin: 0 }}>
                Your AWS account creates an IAM role trusting CloudOptix's principal with an external ID. No long-lived secret keys are ever shared or stored on the server.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConnectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={connectingAws}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {connectingAws ? (
                  <>
                    <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Assuming Role...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Assume IAM Role</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: IAM Permissions Policy */}
        {tab === "policy" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: "700", margin: "0 0 4px 0", color: "var(--text-main)" }}>
                  AWS IAM Policy (JSON) — CloudWatch + Cost Management + EC2 + S3
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                  Includes permissions for live CloudWatch telemetry, AWS Cost Explorer (ce:*), EC2 control, and S3 monitoring.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const policyText = policyType === "compact"
                    ? JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                          {
                            Sid: "CloudOptixAllInOne",
                            Effect: "Allow",
                            Action: ["ec2:*", "cloudwatch:*", "ce:*", "s3:*"],
                            Resource: "*"
                          }
                        ]
                      }, null, 2)
                    : JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                          {
                            Sid: "CloudOptixEC2Management",
                            Effect: "Allow",
                            Action: [
                              "ec2:RunInstances",
                              "ec2:StartInstances",
                              "ec2:StopInstances",
                              "ec2:TerminateInstances",
                              "ec2:DescribeInstances",
                              "ec2:DescribeInstanceStatus",
                              "ec2:DescribeImages",
                              "ec2:DescribeVolumes",
                              "ec2:DescribeAddresses",
                              "ec2:DescribeSecurityGroups",
                              "ec2:DescribeSubnets",
                              "ec2:DescribeVpcs",
                              "ec2:CreateTags",
                              "ec2:DeleteTags"
                            ],
                            Resource: "*"
                          },
                          {
                            Sid: "CloudOptixCloudWatchMetrics",
                            Effect: "Allow",
                            Action: [
                              "cloudwatch:GetMetricData",
                              "cloudwatch:GetMetricStatistics",
                              "cloudwatch:ListMetrics"
                            ],
                            Resource: "*"
                          },
                          {
                            Sid: "CloudOptixCostManagement",
                            Effect: "Allow",
                            Action: [
                              "ce:GetCostAndUsage",
                              "ce:GetCostForecast",
                              "ce:GetDimensionValues"
                            ],
                            Resource: "*"
                          },
                          {
                            Sid: "CloudOptixS3MonitoringAndLifecycle",
                            Effect: "Allow",
                            Action: [
                              "s3:ListAllMyBuckets",
                              "s3:ListBucket",
                              "s3:GetBucketLocation",
                              "s3:GetBucketPublicAccessBlock",
                              "s3:GetAccountPublicAccessBlock",
                              "s3:PutLifecycleConfiguration"
                            ],
                            Resource: "*"
                          }
                        ]
                      }, null, 2);
                  navigator.clipboard.writeText(policyText);
                  setCopiedPolicy(true);
                  setTimeout(() => setCopiedPolicy(false), 2500);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  cursor: "pointer"
                }}
              >
                {copiedPolicy ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
                <span>{copiedPolicy ? "Copied JSON!" : "Copy Policy JSON"}</span>
              </button>
            </div>

            {/* Policy Mode Selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setPolicyType("compact")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: policyType === "compact" ? "2px solid #0284c7" : "1px solid #cbd5e1",
                  background: policyType === "compact" ? "#f0f9ff" : "#ffffff",
                  color: policyType === "compact" ? "#0369a1" : "#475569",
                  fontWeight: "600",
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                ⚡ Ultra-Compact (Recommended — Under 200 chars, No Size Limit)
              </button>
              <button
                type="button"
                onClick={() => setPolicyType("granular")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: policyType === "granular" ? "2px solid #0284c7" : "1px solid #cbd5e1",
                  background: policyType === "granular" ? "#f0f9ff" : "#ffffff",
                  color: policyType === "granular" ? "#0369a1" : "#475569",
                  fontWeight: "600",
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                Detailed Actions (Specific Permissions)
              </button>
            </div>

            <div
              style={{
                position: "relative",
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                padding: "14px",
                maxHeight: "260px",
                overflowY: "auto",
                border: "1px solid #334155",
                marginBottom: "16px"
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  fontFamily: "monospace",
                  color: "#38bdf8",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.4"
                }}
              >
{policyType === "compact"
  ? `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudOptixAllInOne",
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "cloudwatch:*",
        "ce:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}`
  : `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudOptixEC2Management",
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeImages",
        "ec2:DescribeVolumes",
        "ec2:DescribeAddresses",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:CreateTags",
        "ec2:DeleteTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudOptixCloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudOptixCostManagement",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudOptixS3MonitoringAndLifecycle",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPublicAccessBlock",
        "s3:GetAccountPublicAccessBlock",
        "s3:PutLifecycleConfiguration"
      ],
      "Resource": "*"
    }
  ]
}`}
              </pre>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "16px"
              }}
            >
              <strong style={{ color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                How to apply in AWS Console:
              </strong>
              <ol style={{ margin: 0, paddingLeft: "18px", lineHeight: "1.5" }}>
                <li>Open <strong>AWS Management Console</strong> &rarr; <strong>IAM</strong> &rarr; <strong>Users</strong>.</li>
                <li>Select user <strong>cloudoptix-finops-user</strong>.</li>
                <li>Under <strong>Permissions</strong> tab, click <strong>Add permissions</strong> &rarr; <strong>Create inline policy</strong>.</li>
                <li>Switch to the <strong>JSON</strong> tab, paste the code above, and click <strong>Next</strong>.</li>
                <li>Name the policy <strong>CloudOptixFullManagement</strong> and click <strong>Create policy</strong>.</li>
              </ol>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConnectModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
