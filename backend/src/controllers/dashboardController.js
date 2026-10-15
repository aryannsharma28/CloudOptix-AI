const awsCollectorService = require("../services/awsCollectorService");
const mlClientService = require("../services/mlClientService");

exports.getSummary = async (req, res) => {
  try {
    const force = req.query.force === "true";
    const summary = await awsCollectorService.getSummary(force);
    const account = awsCollectorService.getAccountInfo();
    const mode = awsCollectorService.getMode();

    res.json({
      success: true,
      mode,
      account,
      data: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getResources = async (req, res) => {
  try {
    const { type } = req.query;
    const result = await awsCollectorService.fetchActiveResources();
    let resources = result.resources;
    if (type) {
      resources = resources.filter((r) => r.type.toLowerCase() === type.toLowerCase());
    }

    res.json({
      success: true,
      mode: result.mode,
      source: result.source,
      count: resources.length,
      data: resources
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.connectAws = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, roleArn, externalId, isDemoAccount } = req.body;
    const result = await awsCollectorService.connectCredentials({
      accessKeyId,
      secretAccessKey,
      region,
      roleArn,
      externalId,
      isDemoAccount
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || "Failed to authenticate AWS credentials."
    });
  }
};

exports.disconnectAws = async (req, res) => {
  try {
    const result = awsCollectorService.disconnect();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAwsStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      mode: awsCollectorService.getMode(),
      account: awsCollectorService.getAccountInfo()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const force = req.query.force === "true";
    const recommendations = await awsCollectorService.getRecommendations(force);
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.applyOptimization = async (req, res) => {
  try {
    const { recommendationId } = req.body;
    if (!recommendationId) {
      return res.status(400).json({ success: false, error: "recommendationId is required" });
    }

    const result = await awsCollectorService.applyOptimization(recommendationId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.dismissRecommendation = async (req, res) => {
  try {
    const { recommendationId } = req.body;
    if (!recommendationId) {
      return res.status(400).json({ success: false, error: "recommendationId is required" });
    }

    const result = await awsCollectorService.dismissRecommendation(recommendationId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.resetSimulation = async (req, res) => {
  try {
    awsCollectorService.invalidateCache();
    await awsCollectorService.fetchActiveResources(true);
    const summary = await awsCollectorService.getSummary(true);
    res.json({
      success: true,
      message: "Refreshed live AWS telemetry.",
      data: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCostForecast = async (req, res) => {
  try {
    const summary = await awsCollectorService.getSummary();
    const activeSpend = (summary && summary.monthlyCost > 0)
      ? summary.monthlyCost
      : (summary && summary.unproratedFullMonthBaseline > 0)
        ? summary.unproratedFullMonthBaseline
        : 0;
    const forecast = await mlClientService.getCostForecast(summary ? summary.historicalTrend : [], activeSpend);
    res.json({
      success: true,
      data: forecast
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAnomalies = async (req, res) => {
  try {
    const result = await awsCollectorService.fetchActiveResources();
    const anomalies = await mlClientService.detectAnomalies(result.resources);
    res.json({
      success: true,
      data: anomalies
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSecurityChecks = async (req, res) => {
  try {
    const checks = await awsCollectorService.getSecurityChecks();
    res.json({
      success: true,
      data: checks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getK8sMetrics = async (req, res) => {
  try {
    const k8s = awsCollectorService.getK8sClusterMetrics();
    res.json({
      success: true,
      data: k8s
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.enableService = async (req, res) => {
  try {
    const { service, name, instanceType, startedAt, region, costPerMonth, cpuUtilization } = req.body;
    const result = await awsCollectorService.enableService({
      service,
      name,
      instanceType,
      startedAt,
      region,
      costPerMonth,
      cpuUtilization
    });
    const newResource = result.resource || result;
    const summary = await awsCollectorService.getSummary();

    let msg = `AWS ${newResource.service} '${newResource.name}' (${newResource.id}) enabled and live tracking!`;
    if (result.awsProvisioned) {
      msg = `🚀 Real EC2 Instance ${newResource.id} launched successfully on AWS Console in ${newResource.region}! Live tracker connected.`;
    } else if (result.awsError) {
      const isAuthErr = result.awsError.includes("not authorized") || result.awsError.includes("UnauthorizedOperation");
      msg = isAuthErr
        ? `Added to Live Monitored Fleet! (AWS Console Note: Attach the IAM ec2:RunInstances policy to enable automatic provisioning on AWS Console)`
        : `Added to Live Monitored Fleet! (AWS Notice: ${result.awsError})`;
    }

    res.json({
      success: true,
      message: msg,
      data: newResource,
      awsProvisioned: result.awsProvisioned,
      awsError: result.awsError,
      summary
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.serviceAction = async (req, res) => {
  try {
    const { resourceId, action } = req.body;
    if (!resourceId || !action) {
      return res.status(400).json({ success: false, error: "resourceId and action ('stop', 'start', 'terminate') are required." });
    }
    const updated = await awsCollectorService.serviceAction({ resourceId, action });
    const summary = await awsCollectorService.getSummary();
    res.json({
      success: true,
      message: `Action '${action.toUpperCase()}' applied to ${resourceId}. State: ${updated.state}.`,
      data: updated,
      summary
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const result = awsCollectorService.deleteService(id);
    const summary = await awsCollectorService.getSummary();
    res.json({
      success: true,
      ...result,
      summary
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.streamLiveTelemetry = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (res.flushHeaders) res.flushHeaders();

  const sendEvent = async () => {
    try {
      const summary = await awsCollectorService.getSummary();
      const payload = {
        serverTime: new Date().toISOString(),
        summary,
        resources: awsCollectorService.liveResources || []
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // Ignore
    }
  };

  await sendEvent();
  const interval = setInterval(sendEvent, 3000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};

// ==========================================
// DEDICATED EC2 LIVE OPERATIONS & CONTROLLER
// ==========================================

exports.getEc2Fleet = async (req, res) => {
  try {
    const data = await awsCollectorService.getEc2Fleet();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEc2Telemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await awsCollectorService.getEc2Telemetry(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.ec2Action = async (req, res) => {
  try {
    const { resourceId, action, newInstanceType } = req.body;
    if (!resourceId || !action) {
      return res.status(400).json({ success: false, error: "resourceId and action ('stop', 'start', 'reboot', 'resize', 'terminate') are required." });
    }
    const updated = await awsCollectorService.serviceAction({ resourceId, action, newInstanceType });
    const fleet = await awsCollectorService.getEc2Fleet();
    res.json({
      success: true,
      message: `EC2 action '${action.toUpperCase()}' successfully executed on instance ${resourceId}.`,
      data: updated,
      fleetStats: fleet.stats
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.launchEc2 = async (req, res) => {
  try {
    const { name, instanceType, region } = req.body;
    const result = await awsCollectorService.enableService({
      service: "EC2",
      name: name || `ec2-web-${Math.random().toString(16).substring(2, 6)}`,
      instanceType: instanceType || "t3.micro",
      region: region || awsCollectorService.region
    });
    const fleet = await awsCollectorService.getEc2Fleet();
    res.json({
      success: true,
      message: result.awsProvisioned
        ? `🚀 Real EC2 instance ${result.resource?.id} launched on AWS Console!`
        : `EC2 instance ${result.resource?.id} initialized and live tracking!`,
      data: result.resource,
      fleetStats: fleet.stats,
      awsProvisioned: result.awsProvisioned
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==========================================
// DEDICATED S3 LIVE OPERATIONS & CONTROLLER
// ==========================================

exports.getS3Fleet = async (req, res) => {
  try {
    const data = await awsCollectorService.getS3Fleet();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getS3Telemetry = async (req, res) => {
  try {
    const { bucket } = req.params;
    const data = await awsCollectorService.getS3Telemetry(bucket);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createS3Bucket = async (req, res) => {
  try {
    const { bucketName, region, versioning, encryption, blockPublicAccess } = req.body;
    if (!bucketName) {
      return res.status(400).json({ success: false, error: "bucketName is required." });
    }
    const result = await awsCollectorService.createS3Bucket({
      bucketName: bucketName.toLowerCase().trim(),
      region,
      versioning,
      encryption,
      blockPublicAccess
    });
    const fleet = await awsCollectorService.getS3Fleet();
    res.json({
      success: true,
      message: result.awsProvisioned
        ? `🚀 S3 bucket '${bucketName}' successfully created on AWS!`
        : `S3 bucket '${bucketName}' registered and actively tracked!`,
      bucket: result.bucket,
      fleetStats: fleet.stats,
      awsProvisioned: result.awsProvisioned
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteS3Bucket = async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ success: false, error: "bucketName is required." });
    }
    const result = await awsCollectorService.deleteS3Bucket(bucketName);
    const fleet = await awsCollectorService.getS3Fleet();
    res.json({
      success: true,
      message: `Bucket '${bucketName}' deleted successfully.`,
      fleetStats: fleet.stats
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.configureS3Bucket = async (req, res) => {
  try {
    const { bucketName, settings } = req.body;
    if (!bucketName || !settings) {
      return res.status(400).json({ success: false, error: "bucketName and settings are required." });
    }
    const result = await awsCollectorService.configureS3Bucket(bucketName, settings);
    const fleet = await awsCollectorService.getS3Fleet();
    res.json({
      success: true,
      message: `Bucket '${bucketName}' configuration updated.`,
      fleetStats: fleet.stats
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.listS3Objects = async (req, res) => {
  try {
    const { bucket } = req.params;
    if (!bucket) {
      return res.status(400).json({ success: false, error: "Bucket name is required." });
    }
    const data = await awsCollectorService.listS3Objects(bucket);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.uploadS3Object = async (req, res) => {
  try {
    const { bucketName, key, bodyBase64, contentType, storageClass } = req.body;
    if (!bucketName || !bodyBase64) {
      return res.status(400).json({ success: false, error: "bucketName and bodyBase64 are required." });
    }
    const result = await awsCollectorService.uploadS3Object({
      bucketName,
      key,
      bodyBase64,
      contentType,
      storageClass
    });
    const fleet = await awsCollectorService.getS3Fleet();
    res.json({
      success: true,
      ...result,
      fleetStats: fleet.stats
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteS3Object = async (req, res) => {
  try {
    const { bucketName, key } = req.body;
    if (!bucketName || !key) {
      return res.status(400).json({ success: false, error: "bucketName and key are required." });
    }
    const result = await awsCollectorService.deleteS3Object({ bucketName, key });
    const fleet = await awsCollectorService.getS3Fleet();
    res.json({
      success: true,
      ...result,
      fleetStats: fleet.stats
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


