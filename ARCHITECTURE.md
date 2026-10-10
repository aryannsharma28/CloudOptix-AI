# CloudOptix AI — Architectural Blueprint & System Design

**AI-Powered Cloud Cost Optimization & FinOps Resource Management Platform**  
*Tailored for BTech Computer Science & Engineering (Cloud Computing Specialization)*

---

## 1. Executive Summary & Problem Statement

Modern enterprises operating on public cloud infrastructure (such as AWS) routinely suffer from **30% to 45% unoptimized cloud spend**. This waste typically stems from:
1. **Over-provisioned Compute**: EC2 instances configured with large instance types (e.g., `m5.xlarge`, `t3.large`) that average less than 5% sustained CPU utilization.
2. **Orphaned Storage**: Detached Elastic Block Store (EBS) volumes left active with provisioned IOPS after their parent EC2 instances are terminated.
3. **Idle Database Replicas**: Amazon RDS read replicas consuming provisioned IOPS and memory without any active database client connections.
4. **Stagnant Object Storage**: Multi-terabyte Amazon S3 buckets holding infrequently accessed data in standard tiers rather than cost-effective Glacier tiers.
5. **24/7 Staging Environments**: Non-production instances left running during off-hours (nights and weekends) incurring 168 hours/week of unnecessary billing.

**CloudOptix AI** solves this by uniting real-time CloudWatch telemetry collection, an automated FinOps heuristic rule engine, and a Python Machine Learning time-series forecaster with Kubernetes auto-scaling orchestration.

---

## 2. High-Level Architecture

```mermaid
graph TD
    User([Cloud Administrator / DevOps]) -->|HTTPS / Port 3000| Frontend[React 18 + Vite Glassmorphic Dashboard]
    Frontend -->|REST API / JSON| Backend[Node.js / Express API Gateway]

    subgraph "Backend Services Layer (Port 5000)"
        Backend --> TelemetrySynth[Enterprise Telemetry Synthesizer]
        Backend --> AwsCollector[AWS SDK v3 Client Service]
        Backend --> FinOpsRules[FinOps Optimization Rule Engine]
        Backend --> MLBridge[ML Microservice Client Bridge]
        Backend --> PG[(PostgreSQL Database)]
    end

    subgraph "Python AI/ML Microservice (Port 8000)"
        MLBridge -->|HTTP POST| FastAPIEngine[FastAPI Microservice]
        FastAPIEngine --> Forecaster[Time-Series Trend Forecaster]
        FastAPIEngine --> AnomalyEngine[Z-Score & Isolation Forest Outlier Detector]
        FastAPIEngine --> Rightsizer[Instance Catalog Rightsizing Heuristic]
    end

    subgraph "Container & Cloud Orchestration"
        DockerCompose[Docker Compose Multi-Container Stack]
        K8sCluster[Kubernetes Cluster (EKS)]
        HPA[Horizontal Pod Autoscaler (HPA)]
        CICD[GitHub Actions CI/CD Pipeline]
    end
```

---

## 3. Core Component Deep Dive

### 3.1 Frontend Tier (React 18 + Vite)
- **Design Paradigm**: Dark glassmorphic interface inspired by modern cloud consoles (AWS Management Console, Datadog, Kubecost).
- **Styling Architecture**: Vanilla CSS custom properties (design tokens) without bloated third-party frameworks, guaranteeing maximum performance, zero layout shift, and sub-second rendering.
- **State Management**: React Context (`CloudContext`) managing real-time telemetry polling, currency localization (INR ₹ / USD $), and interactive "What-If" simulation dispatches.

### 3.2 Backend API Gateway (Node.js & Express)
- **AWS SDK v3 Client**: Directly integrates with `@aws-sdk/client-ec2`, `@aws-sdk/client-s3`, and `@aws-sdk/client-cloudwatch`.
- **Dual Mode Architecture**:
  - **Live Mode**: Queries active AWS accounts if IAM credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are present in `.env`.
  - **Telemetry Simulator Mode**: Generates 24 realistic enterprise AWS cloud resources across EC2, RDS, S3, EBS, and Lambda with dynamic utilization spikes and underutilization flags.
- **Simulation Engine**: Supports executing rightsizing recommendations (e.g. `t3.large` &rarr; `t3.micro`), immediately recalculating run-rate from ₹18,450 to reduced expenditure in real time.

### 3.3 Python AI/ML Engine (`ml-service`)
- **Microservice Architecture**: Python 3.11 with FastAPI / Uvicorn and Scikit-Learn.
- **Time-Series Spend Forecasting**: Fits autoregressive linear and polynomial trend lines over rolling historical cloud usage points, generating 30/60/90-day predictive horizons with 95% statistical confidence bounds.
- **Anomaly Detection**: Evaluates resource metrics using Z-score outlier analysis ($z = \frac{x - \mu}{\sigma}$) to flag anomalous idle compute drain and orphaned high-IOPS storage disks.

### 3.4 DevOps & Orchestration Tier
- **Multi-Stage Dockerfiles**:
  - Frontend: Stage 1 builds React bundle with Node 20; Stage 2 serves static files with ultra-lightweight Nginx Alpine (<25 MB image).
  - Backend: Production-hardened Node.js image with non-root user and health checks.
  - ML Engine: Python slim image with cached pip wheels.
- **Kubernetes Production Manifests (`/k8s`)**:
  - `postgres-statefulset.yaml`: Persistent volume claim (PVC) for durable storage.
  - `backend-deployment.yaml` & `frontend-deployment.yaml`: Replicated pods with readiness/liveness probes.
  - `hpa.yaml`: **Horizontal Pod Autoscaler** dynamically scaling backend pods from 2 to 10 replicas when CPU exceeds 70%.
  - `ingress.yaml`: Unified routing for external traffic.
- **CI/CD Pipeline (`.github/workflows/ci-cd.yml`)**:
  - Automated testing, linting, container builds, and dry-run Kubernetes manifest verification.

---

## 4. FinOps Rightsizing Logic & Formulas

### EC2 Rightsizing Formula
$$\text{Average CPU}_{30\text{d}} < 5\% \implies \text{Recommend Tier Downsize} \quad (t3.large \to t3.micro)$$
$$\text{Monthly Savings} = (\text{Cost}_{\text{current}} - \text{Cost}_{\text{recommended}}) \times 730 \text{ hrs/month}$$

### Off-Hours Scheduling Formula (Staging Workloads)
$$\text{Active Hours}_{\text{Scheduled}} = 11 \text{ hrs/day} \times 5 \text{ days/week} = 55 \text{ hrs/week}$$
$$\text{Baseline Hours} = 168 \text{ hrs/week}$$
$$\text{Savings} = \left(1 - \frac{55}{168}\right) \times 100\% = \mathbf{67.26\% \text{ Compute Savings}}$$

### Horizontal Pod Autoscaling (HPA) Formula
$$\text{Desired Replicas} = \left\lceil \text{Current Replicas} \times \left( \frac{\text{Current Metric Value}}{\text{Target Metric Value}} \right) \right\rceil$$
