import React, { createContext, useContext, useState, useEffect } from "react";

const CloudContext = createContext();

export const CloudProvider = ({ children }) => {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudoptix_active_tab");
      return saved === "k8s" ? "overview" : (saved || "overview");
    } catch {
      return "overview";
    }
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem("cloudoptix_active_tab", tab);
    } catch {}
  };

  const [currency, setCurrencyState] = useState(() => {
    try {
      return localStorage.getItem("cloudoptix_currency") || "INR";
    } catch {
      return "INR";
    }
  });

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    try {
      localStorage.setItem("cloudoptix_currency", curr);
    } catch {}
  };
  const [summary, setSummary] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cloudoptix_cached_summary");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [resources, setResources] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cloudoptix_cached_resources");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(!summary);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [account, setAccount] = useState(null);
  const [mode, setMode] = useState("LIVE_AWS");
  const [recommendations, setRecommendations] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [security, setSecurity] = useState([]);
  const [k8s, setK8s] = useState(null);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectingAws, setConnectingAws] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async (silent = false) => {
    try {
      // Only show full blocking loader on cold boot if no cached summary exists
      if (!silent && !summary) {
        setLoading(true);
      }
      setIsSyncing(true);

      const [sumRes, resRes, recRes, fctRes, anmRes, secRes, k8sRes] = await Promise.all([
        fetch(`${API_BASE}/summary`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/resources`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/recommendations`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/forecast`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/anomalies`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/security`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/k8s`).then((r) => r.json()).catch(() => ({ success: false }))
      ]);

      if (sumRes.success && sumRes.data) {
        const enrichedSummary = { ...sumRes.data };
        if (resRes.success && Array.isArray(resRes.data) && resRes.data.length > 0) {
          const nonTerminated = resRes.data.filter((r) => r.state !== "terminated" && r.state !== "deleted");
          if (!enrichedSummary.activeResources || enrichedSummary.activeResources === 0) {
            enrichedSummary.activeResources = nonTerminated.length;
          }
          const calcMonthly = Math.round(nonTerminated.reduce((sum, r) => sum + (r.projectedMonthCost || r.costPerMonth || 0), 0));
          if (!enrichedSummary.monthlyCost || enrichedSummary.monthlyCost === 0) {
            enrichedSummary.monthlyCost = calcMonthly;
          }
          if (!enrichedSummary.estimatedNextMonth || enrichedSummary.estimatedNextMonth === 0) {
            enrichedSummary.estimatedNextMonth = Math.round(calcMonthly * 1.149);
          }
        }
        if (recRes.success && Array.isArray(recRes.data) && recRes.data.length > 0) {
          const calcSavings = recRes.data
            .filter((r) => !r.applied && !r.closed)
            .reduce((sum, r) => sum + (r.monthlySavings || 0), 0);
          if (!enrichedSummary.potentialSavings || enrichedSummary.potentialSavings === 0) {
            enrichedSummary.potentialSavings = calcSavings;
          }
        }
        setSummary(enrichedSummary);
        setAccount(sumRes.account);
        setMode(sumRes.mode);
        try {
          sessionStorage.setItem("cloudoptix_cached_summary", JSON.stringify(enrichedSummary));
        } catch {}
      }
      if (resRes.success) {
        setResources(resRes.data);
        try {
          sessionStorage.setItem("cloudoptix_cached_resources", JSON.stringify(resRes.data));
        } catch {}
      }
      if (recRes.success) setRecommendations(recRes.data);
      if (fctRes.success) setForecast(fctRes.data);
      if (anmRes.success) setAnomalies(fctRes.data ? anmRes.data : null);
      if (secRes.success) setSecurity(secRes.data);
      if (k8sRes.success) setK8s(k8sRes.data);

      setError(null);
    } catch (err) {
      console.error("API connection error:", err);
      if (!summary) {
        setError(`Unable to connect to backend server at ${import.meta.env.VITE_API_URL || "http://localhost:5000"}.`);
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const refetchForecast = async () => {
    try {
      const res = await fetch(`${API_BASE}/forecast`);
      const data = await res.json();
      if (data && data.success && data.data) {
        setForecast(data.data);
        return data.data;
      }
    } catch (e) {
      console.warn("Forecast refetch error:", e);
    }
    return null;
  };

  useEffect(() => {
    // Initial fetch: silent if we already loaded cached data from sessionStorage
    fetchAllData(!!summary);
  }, []);

  // Live streaming heartbeat: poll backend every 8 seconds for telemetry sync
  useEffect(() => {
    if (!isLiveStreaming) return;
    const syncInterval = setInterval(async () => {
      try {
        const [sumRes, resRes, fctRes] = await Promise.all([
          fetch(`${API_BASE}/summary`).then((r) => r.json()).catch(() => null),
          fetch(`${API_BASE}/resources`).then((r) => r.json()).catch(() => null),
          fetch(`${API_BASE}/forecast`).then((r) => r.json()).catch(() => null)
        ]);
        if (sumRes && sumRes.success && sumRes.data) {
          const enrichedSummary = { ...sumRes.data };
          if (resRes && resRes.success && Array.isArray(resRes.data) && resRes.data.length > 0) {
            const nonTerminated = resRes.data.filter((r) => r.state !== "terminated" && r.state !== "deleted");
            if (!enrichedSummary.activeResources || enrichedSummary.activeResources === 0) {
              enrichedSummary.activeResources = nonTerminated.length;
            }
            const calcMonthly = Math.round(nonTerminated.reduce((sum, r) => sum + (r.projectedMonthCost || r.costPerMonth || 0), 0));
            if (!enrichedSummary.monthlyCost || enrichedSummary.monthlyCost === 0) {
              enrichedSummary.monthlyCost = calcMonthly;
            }
            if (!enrichedSummary.estimatedNextMonth || enrichedSummary.estimatedNextMonth === 0) {
              enrichedSummary.estimatedNextMonth = Math.round(calcMonthly * 1.149);
            }
          }
          setSummary(enrichedSummary);
          setMode(sumRes.mode);
          if (sumRes.account) setAccount(sumRes.account);
          try {
            sessionStorage.setItem("cloudoptix_cached_summary", JSON.stringify(enrichedSummary));
          } catch {}
        }
        if (resRes && resRes.success) {
          setResources(resRes.data);
          try {
            sessionStorage.setItem("cloudoptix_cached_resources", JSON.stringify(resRes.data));
          } catch {}
        }
        if (fctRes && fctRes.success && fctRes.data) {
          setForecast(fctRes.data);
        }
      } catch (e) {
        // Silent error on background poll
      }
    }, 8000);
    return () => clearInterval(syncInterval);
  }, [isLiveStreaming]);

  // Second-by-second live client-side ticker: increments elapsed seconds and updates accrued spend live!
  useEffect(() => {
    if (!isLiveStreaming) return;
    const secondTimer = setInterval(() => {
      setResources((prev) => {
        if (!prev || prev.length === 0) return prev;
        let totalLiveIncurred = 0;
        const updated = prev.map((r) => {
          if (r.state === "stopped" || r.state === "terminated") {
            totalLiveIncurred += (r.incurredCost || 0);
            return r;
          }
          const secRate = r.secondRate || (r.hourlyRate ? r.hourlyRate / 3600 : 0);
          const newIncurred = Math.round(((r.incurredCost || 0) + secRate) * 100) / 100;
          const newSeconds = (r.uptimeSeconds || 0) + 1;
          const totalDays = Math.floor(newSeconds / 86400);
          const remHours = Math.floor((newSeconds % 86400) / 3600);
          const remMins = Math.floor((newSeconds % 3600) / 60);
          const remSecs = newSeconds % 60;
          let fmt = "";
          if (totalDays > 0) fmt += `${totalDays}d `;
          if (remHours > 0 || totalDays > 0) fmt += `${remHours}h `;
          fmt += `${remMins}m ${remSecs}s`;

          totalLiveIncurred += newIncurred;
          return {
            ...r,
            uptimeSeconds: newSeconds,
            uptimeFormatted: fmt.trim(),
            incurredCost: newIncurred
          };
        });

        setSummary((s) => {
          if (!s) return s;
          const updatedSum = { ...s, incurredSpendToDate: Math.round(totalLiveIncurred * 100) / 100 };
          if ((!updatedSum.activeResources || updatedSum.activeResources === 0) && updated.length > 0) {
            updatedSum.activeResources = updated.filter((r) => r.state !== "terminated" && r.state !== "deleted").length;
          }
          if ((!updatedSum.monthlyCost || updatedSum.monthlyCost === 0) && updated.length > 0) {
            updatedSum.monthlyCost = Math.round(updated.reduce((sum, r) => sum + (r.projectedMonthCost || r.costPerMonth || 0), 0));
          }
          if ((!updatedSum.estimatedNextMonth || updatedSum.estimatedNextMonth === 0) && updatedSum.monthlyCost > 0) {
            updatedSum.estimatedNextMonth = Math.round(updatedSum.monthlyCost * 1.149);
          }
          return updatedSum;
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(secondTimer);
  }, [isLiveStreaming]);

  const connectAwsAccount = async (credentials) => {
    try {
      setConnectingAws(true);
      const res = await fetch(`${API_BASE}/aws/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (data.success) {
        setMode(data.mode);
        if (data.account) setAccount(data.account);
        showToast(data.message || "Connected to AWS Account!", "success");
        setIsConnectModalOpen(false);
        await fetchAllData();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Failed to authenticate with AWS." };
      }
    } catch (err) {
      return { success: false, error: err.message || "Network error while connecting to AWS." };
    } finally {
      setConnectingAws(false);
    }
  };

  const disconnectAwsAccount = async () => {
    try {
      const res = await fetch(`${API_BASE}/aws/disconnect`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMode("DISCONNECTED");
        setAccount(null);
        setResources([]);
        setRecommendations([]);
        setSummary({
          monthlyCost: 0,
          incurredSpendToDate: 0,
          unproratedFullMonthBaseline: 0,
          estimatedNextMonth: 0,
          activeResources: 0,
          underutilizedResources: 0,
          potentialSavings: 0,
          costBreakdown: { EC2: 0, S3: 0, RDS: 0, Other: 0 },
          incurredBreakdown: { EC2: 0, S3: 0, RDS: 0, Other: 0 },
          historicalTrend: []
        });
        showToast("AWS Account disconnected successfully", "info");
      }
    } catch (err) {
      showToast("Error disconnecting AWS account", "error");
    }
  };

  const formatCurrency = (amountInINR, showDecimals = false) => {
    if (amountInINR === undefined || amountInINR === null) return "—";
    const num = Number(amountInINR);
    if (isNaN(num)) return "—";
    if (currency === "USD") {
      const usdVal = num * 0.012;
      return showDecimals
        ? `$${usdVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${Math.round(usdVal).toLocaleString("en-US")}`;
    }
    return showDecimals
      ? `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `₹${Math.round(num).toLocaleString("en-IN")}`;
  };

  const enableService = async (serviceData) => {
    try {
      const res = await fetch(`${API_BASE}/services/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        if (data.summary) setSummary(data.summary);
        await fetchAllData();
        return { success: true, data: data.data };
      } else {
        showToast(data.error || "Failed to enable service", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error enabling service", "error");
      return { success: false, error: err.message };
    }
  };

  const serviceAction = async (resourceId, action) => {
    try {
      const res = await fetch(`${API_BASE}/services/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, action })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        if (data.summary) setSummary(data.summary);
        await fetchAllData();
        return { success: true };
      } else {
        showToast(data.error || `Failed to ${action} service`, "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || `Network error executing ${action}`, "error");
      return { success: false, error: err.message };
    }
  };

  const deleteService = async (resourceId) => {
    try {
      const res = await fetch(`${API_BASE}/services/${resourceId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "info");
        if (data.summary) setSummary(data.summary);
        await fetchAllData();
        return { success: true };
      } else {
        showToast(data.error || "Failed to delete service", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error deleting service", "error");
      return { success: false, error: err.message };
    }
  };

  const applyOptimization = async (recommendationId) => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        if (data.updatedSummary) {
          setSummary(data.updatedSummary);
        }
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === recommendationId
              ? { ...r, applied: true, closed: true, awsExecution: data.awsExecution }
              : r
          )
        );
        fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || data.message || "Failed to adjust resource on AWS", "warning");
        return { success: false, error: data.error || data.message };
      }
    } catch (err) {
      showToast(err.message || "Network error applying AWS optimization", "error");
      return { success: false, error: err.message };
    }
  };

  const dismissRecommendation = async (recommendationId) => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Recommendation closed and dismissed.", "info");
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === recommendationId ? { ...r, applied: true, closed: true, dismissed: true } : r
          )
        );
        if (data.updatedSummary) {
          setSummary(data.updatedSummary);
        }
      }
    } catch (err) {
      showToast("Failed to close recommendation", "error");
    }
  };

  const resetSimulation = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/reset`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Synchronized real-time telemetry with AWS!", "success");
        await fetchAllData();
      }
    } catch (err) {
      showToast("Failed to sync with AWS", "error");
    }
  };

  const rebootEc2 = async (resourceId) => {
    return serviceAction(resourceId, "reboot");
  };

  const resizeEc2 = async (resourceId, newInstanceType) => {
    try {
      const res = await fetch(`${API_BASE}/ec2/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, action: "resize", newInstanceType })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Instance ${resourceId} resized to ${newInstanceType}!`, "success");
        await fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || "Failed to resize instance", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error resizing instance", "error");
      return { success: false, error: err.message };
    }
  };

  const launchEc2 = async ({ name, instanceType, region }) => {
    try {
      const res = await fetch(`${API_BASE}/ec2/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, instanceType, region })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        await fetchAllData();
        return { success: true, data: data.data };
      } else {
        showToast(data.error || "Failed to launch EC2 instance", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error launching EC2 instance", "error");
      return { success: false, error: err.message };
    }
  };

  const fetchEc2Telemetry = async (instanceId) => {
    try {
      const res = await fetch(`${API_BASE}/ec2/${instanceId}/telemetry`);
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const fetchEc2Fleet = async () => {
    try {
      const res = await fetch(`${API_BASE}/ec2/fleet`);
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Dedicated S3 Live Operations & Management Functions
  const fetchS3Fleet = async () => {
    try {
      const res = await fetch(`${API_BASE}/s3/fleet`);
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const fetchS3Telemetry = async (bucketName) => {
    try {
      const res = await fetch(`${API_BASE}/s3/${bucketName}/telemetry`);
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const createS3Bucket = async ({ bucketName, region, versioning, encryption, blockPublicAccess }) => {
    try {
      const res = await fetch(`${API_BASE}/s3/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName, region, versioning, encryption, blockPublicAccess })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        await fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || "Failed to create S3 bucket", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error creating S3 bucket", "error");
      return { success: false, error: err.message };
    }
  };

  const deleteS3Bucket = async (bucketName) => {
    try {
      const res = await fetch(`${API_BASE}/s3/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "info");
        await fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || "Failed to delete S3 bucket", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error deleting S3 bucket", "error");
      return { success: false, error: err.message };
    }
  };

  const configureS3Bucket = async (bucketName, settings) => {
    try {
      const res = await fetch(`${API_BASE}/s3/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName, settings })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        await fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || "Failed to update S3 configuration", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error configuring S3 bucket", "error");
      return { success: false, error: err.message };
    }
  };

  const listS3Objects = async (bucketName) => {
    try {
      const res = await fetch(`${API_BASE}/s3/${bucketName}/objects`);
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message, objects: [] };
    }
  };

  const uploadS3Object = async ({ bucketName, key, bodyBase64, contentType, storageClass }) => {
    try {
      const res = await fetch(`${API_BASE}/s3/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName, key, bodyBase64, contentType, storageClass })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "File uploaded successfully!", "success");
        await fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || "Failed to upload object", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error uploading object", "error");
      return { success: false, error: err.message };
    }
  };

  const deleteS3Object = async (bucketName, key) => {
    try {
      const res = await fetch(`${API_BASE}/s3/object/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName, key })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Object deleted.`, "info");
        await fetchAllData();
        return { success: true, data };
      } else {
        showToast(data.error || "Failed to delete object", "error");
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast(err.message || "Network error deleting object", "error");
      return { success: false, error: err.message };
    }
  };

  return (
    <CloudContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currency,
        setCurrency,
        loading,
        isSyncing,
        error,
        toast,
        summary,
        account,
        mode,
        resources,
        recommendations,
        forecast,
        refetchForecast,
        anomalies,
        security,
        k8s,
        isConnectModalOpen,
        setIsConnectModalOpen,
        connectingAws,
        connectAwsAccount,
        disconnectAwsAccount,
        formatCurrency,
        applyOptimization,
        dismissRecommendation,
        resetSimulation,
        refreshData: (silent = true) => fetchAllData(silent),
        isLiveStreaming,
        setIsLiveStreaming,
        isEnableModalOpen,
        setIsEnableModalOpen,
        enableService,
        serviceAction,
        deleteService,
        rebootEc2,
        resizeEc2,
        launchEc2,
        fetchEc2Telemetry,
        fetchEc2Fleet,
        fetchS3Fleet,
        fetchS3Telemetry,
        createS3Bucket,
        deleteS3Bucket,
        configureS3Bucket,
        listS3Objects,
        uploadS3Object,
        deleteS3Object
      }}
    >
      {children}
    </CloudContext.Provider>
  );
};

export const useCloud = () => {
  const context = useContext(CloudContext);
  if (!context) throw new Error("useCloud must be used within a CloudProvider");
  return context;
};
