# ☁️ CloudOptix AI
### AI-Powered Cloud Cost Optimization & FinOps Resource Management Platform

> **Tailored for BTech CSE (Cloud Computing Specialization) Capstone & Viva Showcase**  
> *A production-grade FinOps platform demonstrating AWS telemetry, Python ML spend forecasting, Docker multi-stage containers, and Kubernetes Horizontal Pod Autoscaling (HPA).*

---

## 🌟 Executive Summary

In enterprise cloud environments, **30% to 45% of AWS expenditure is wasted** on overprovisioned compute instances, orphaned storage volumes, and idle staging environments. 

**CloudOptix AI** bridges cloud architecture, machine learning, and DevOps into a unified FinOps dashboard. It continuously monitors AWS cloud telemetry, diagnoses underutilization, forecasts future expenditure with 95% statistical confidence intervals, and provides one-click rightsizing and Kubernetes autoscaling policies.

---

## 📊 Live Dashboard Metrics (Prompt Baseline)

| Metric | Baseline Value | FinOps Status / Context |
| :--- | :--- | :--- |
| **Current Monthly Spend** | **₹18,450** | Current active billing cycle run-rate |
| **Estimated Next Month** | **₹21,200** | +14.9% projected increase via ML autoregressive forecast |
| **Active Monitored Fleet** | **24 Resources** | Monitored across EC2, RDS, S3, EBS, and Lambda |
| **Underutilized Assets** | **6 Resources** | CPU < 5%, unattached EBS disks, or idle DB replicas |
| **Potential Monthly Savings**| **₹5,650** | **30.6% spend reduction** via rightsizing |

### AWS Service Cost Breakdown
- 🖥️ **Amazon EC2 (Compute)**: ₹8,200 (44.4%)
- 🗄️ **Amazon RDS (Database)**: ₹5,600 (30.4%)
- 📦 **Amazon S3 (Storage)**: ₹2,100 (11.4%)
- ⚡ **Other (Lambda / EKS / NAT Gateway)**: ₹2,550 (13.8%)

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([Cloud Administrator]) -->|HTTPS / Port 3000| Frontend[React 18 + Vite Glassmorphic UI]
    Frontend -->|REST API / Port 5000| Backend[Node.js / Express API Gateway]

    subgraph "Backend Services Layer"
        Backend --> TelemetrySynth[Enterprise Telemetry Synthesizer]
        Backend --> AwsCollector[AWS SDK v3 Client Service]
        Backend --> FinOpsRules[FinOps Rightsizing Rule Engine]
        Backend --> MLBridge[ML Microservice Client Bridge]
        Backend --> PG[(PostgreSQL Database)]
    end

    subgraph "Python AI/ML Engine (Port 8000)"
        MLBridge -->|HTTP / JSON| FastAPIEngine[FastAPI Microservice]
        FastAPIEngine --> Forecaster[Autoregressive Time-Series Forecaster]
        FastAPIEngine --> AnomalyEngine[Z-Score & Isolation Forest Outlier Detector]
    end

    subgraph "Cloud & DevOps Layer"
        DockerCompose[Docker Compose Multi-Tier Stack]
        K8sCluster[Kubernetes Cluster / EKS]
        HPA[Horizontal Pod Autoscaler (HPA)]
        CICD[GitHub Actions CI/CD Pipeline]
    end
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Key Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Lucide Icons, Pure CSS | Glassmorphic dashboard, responsive charts, interactive rightsizing |
| **Backend API** | Node.js, Express, AWS SDK v3 (`@aws-sdk/client-*`) | Dual-mode telemetry ingestion (Live AWS + Enterprise Simulator) |
| **AI / Machine Learning** | Python 3.11, FastAPI, Scikit-Learn, NumPy | Autoregressive spend forecasting and Z-score anomaly detection |
| **Database** | PostgreSQL 16 Alpine | Persistent financial records, audit logs, and resource inventory |
| **Containerization** | Docker, Docker Compose | Multi-stage production builds (<25MB Nginx Alpine image) |
| **Orchestration** | Kubernetes (EKS / Minikube), HPA | StatefulSets, Deployments, Services, and CPU Auto-scaling |
| **DevOps / CI-CD** | GitHub Actions | Automated linting, test suites, container builds, and dry-run K8s |

---

## 🚀 Quickstart Guide

### Option 1: Local Development (Instant Launch)

1. **Start the Backend API**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   *API will start at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)*

2. **Start the React Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *Dashboard will open at `http://localhost:5173`*

3. **(Optional) Run Python ML Microservice**:
   ```bash
   cd ../ml-service
   pip install -r requirements.txt
   python app.py
   ```
   *(Note: If Python is offline, the backend automatically uses its embedded mathematical regression engine with zero interruption!)*

---

### Option 2: 1-Click Docker Compose Launch

Spin up PostgreSQL, Python ML Engine, Express Backend, and React Frontend in isolated containers:
```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- ML Microservice: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

### Option 3: Kubernetes Deployment

Deploy to any Kubernetes cluster (Minikube, kind, or AWS EKS):
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/ml-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

Inspect the auto-scaling policy:
```bash
kubectl get hpa cloudoptix-backend-hpa
```

---

## 🧪 Automated Testing

Run the automated test suite verifying FinOps calculations, simulation state transitions, and ML forecasts:
```bash
cd backend
npm test
```

Expected output:
```
🧪 Running CloudOptix Backend Test Suite...
✅ Test 1: Telemetry baseline metrics verified.
✅ Test 2: Service cost breakdown matches specifications.
✅ Test 3: FinOps simulation execution and dynamic cost recalculation verified.
✅ Test 4: Simulator reset state verified.
✅ Test 5: Predictive ML forecast engine verified.
🎉 All 5 test suites passed successfully!
```

---

