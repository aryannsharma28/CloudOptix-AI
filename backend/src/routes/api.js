const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authController = require("../controllers/authController");

// User Authentication & Session Management (Password, Google, Phone OTP & Email OTP)
router.post("/auth/login", authController.loginWithPassword);
router.post("/auth/register", authController.registerWithPassword);
router.post("/auth/phone/send-otp", authController.sendPhoneOtp);
router.post("/auth/phone/verify-otp", authController.verifyPhoneOtp);
router.post("/auth/email/send-otp", authController.sendEmailOtp);
router.post("/auth/email/verify-otp", authController.verifyEmailOtp);
router.post("/auth/google", authController.googleSignIn);
router.get("/auth/me", authController.getCurrentUser);
router.get("/auth/users", authController.getAllUsers);
router.post("/auth/logout", authController.logout);
router.put("/auth/profile", authController.updateProfile);

// Health & Status
router.get("/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    service: "CloudOptix FinOps API Gateway",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Summary & Metrics
router.get("/summary", dashboardController.getSummary);

// Live Telemetry Streaming (SSE)
router.get("/stream", dashboardController.streamLiveTelemetry);

// Resources
router.get("/resources", dashboardController.getResources);

// Live Service Enablement & Control
router.post("/services/enable", dashboardController.enableService);
router.post("/services/action", dashboardController.serviceAction);
router.delete("/services/:id", dashboardController.deleteService);

// AWS Live Account Connection
router.post("/aws/connect", dashboardController.connectAws);
router.post("/aws/disconnect", dashboardController.disconnectAws);
router.get("/aws/status", dashboardController.getAwsStatus);

// FinOps Recommendations
router.get("/recommendations", dashboardController.getRecommendations);
router.post("/recommendations/apply", dashboardController.applyOptimization);
router.post("/recommendations/dismiss", dashboardController.dismissRecommendation);
router.post("/simulation/reset", dashboardController.resetSimulation);

// AI/ML Predictive Endpoints
router.get("/forecast", dashboardController.getCostForecast);
router.get("/anomalies", dashboardController.getAnomalies);

// Cloud Security & Best Practices
router.get("/security", dashboardController.getSecurityChecks);

// Kubernetes & Autoscaling Telemetry
router.get("/k8s", dashboardController.getK8sMetrics);

// Dedicated EC2 Live Operations & Fleet Management
router.get("/ec2/fleet", dashboardController.getEc2Fleet);
router.get("/ec2/:id/telemetry", dashboardController.getEc2Telemetry);
router.post("/ec2/action", dashboardController.ec2Action);
router.post("/ec2/launch", dashboardController.launchEc2);

// Dedicated S3 Live Operations & Bucket Management
router.get("/s3/fleet", dashboardController.getS3Fleet);
router.get("/s3/:bucket/telemetry", dashboardController.getS3Telemetry);
router.get("/s3/:bucket/objects", dashboardController.listS3Objects);
router.post("/s3/create", dashboardController.createS3Bucket);
router.post("/s3/delete", dashboardController.deleteS3Bucket);
router.post("/s3/configure", dashboardController.configureS3Bucket);
router.post("/s3/upload", dashboardController.uploadS3Object);
router.post("/s3/object/delete", dashboardController.deleteS3Object);

module.exports = router;

