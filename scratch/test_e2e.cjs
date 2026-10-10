const http = require("http");
const assert = require("assert");

const BASE_URL = "http://localhost:5000";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: null, rawBody: body });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.setHeader("Content-Type", "application/json");
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runE2EVerification() {
  console.log("=================================================");
  console.log("🔍 Running Automated CloudOptix AI End-to-End Suite");
  console.log("=================================================");

  // 1. Normal User Authentication
  console.log("\n[1] Testing Normal User Sign-In (aryan.cloud@gmail.com)...");
  const userLogin = await request("/api/auth/google", {
    method: "POST",
    body: {
      email: "aryan.cloud@gmail.com",
      name: "Aryan AWS FinOps",
      picture: "https://ui-avatars.com/api/?name=Aryan"
    }
  });
  assert.strictEqual(userLogin.status, 200, "Normal user sign-in should return 200 OK");
  assert.strictEqual(userLogin.body.success, true, "Sign-in should be successful");
  const userToken = userLogin.body.token;
  const normalUser = userLogin.body.user;
  console.log(`✅ Logged in as: ${normalUser.name} (${normalUser.email}), Role: ${normalUser.role}`);

  // 2. Normal User Authorization Rejection (403 Forbidden)
  console.log("\n[2] Testing Backend Role Protection for Normal User...");
  const adminVerifyAttempt = await request("/api/admin/verify", {
    method: "GET",
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log(`   Response status: ${adminVerifyAttempt.status}`);
  console.log(`   Response body:`, adminVerifyAttempt.body);
  assert.strictEqual(adminVerifyAttempt.status, 403, "Normal user MUST receive HTTP 403 Forbidden");
  assert.strictEqual(adminVerifyAttempt.body.success, false, "Success must be false");
  const errMsg = adminVerifyAttempt.body.error || adminVerifyAttempt.body.message || "";
  assert.ok(errMsg.includes("Administrator privileges required"), "Proper error message returned");
  console.log("✅ Normal user strictly rejected with HTTP 403 Forbidden from /api/admin/verify");

  const adminStatsAttempt = await request("/api/admin/stats", {
    method: "GET",
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(adminStatsAttempt.status, 403, "Normal user MUST receive 403 from /api/admin/stats");
  assert.strictEqual(adminStatsAttempt.body.data, undefined, "Zero admin telemetry exposed to normal user");
  console.log("✅ Zero admin telemetry exposed to normal user on /api/admin/stats");

  // 3. Admin Authentication & Role Verification
  console.log("\n[3] Testing Administrator Sign-In (admin@cloudoptix.ai)...");
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "admin@cloudoptix.ai",
      password: "Admin@12345"
    }
  });
  assert.strictEqual(adminLogin.status, 200, "Admin login should return 200 OK");
  assert.strictEqual(adminLogin.body.success, true, "Admin login should succeed");
  const adminToken = adminLogin.body.token;
  const adminUser = adminLogin.body.user;
  assert.strictEqual(adminUser.role, "ADMIN", "Role must be ADMIN");
  console.log(`✅ Admin authenticated: ${adminUser.name} (${adminUser.email}), Role: ${adminUser.role}`);

  // 4. Admin Access to Admin APIs
  console.log("\n[4] Testing Administrator Access to /api/admin/verify & /api/admin/stats...");
  const adminVerify = await request("/api/admin/verify", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminVerify.status, 200, "Admin verify must return 200 OK");
  assert.strictEqual(adminVerify.body.success, true);
  console.log("✅ Admin successfully verified on /api/admin/verify");

  const adminStats = await request("/api/admin/stats", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminStats.status, 200, "Admin stats must return 200 OK");
  assert.ok(adminStats.body.data.totalUsers >= 1, "Stats should contain total users");
  assert.ok(adminStats.body.data.systemHealth, "Stats should contain system health");
  console.log(`✅ Admin received real platform telemetry: Total Users: ${adminStats.body.data.totalUsers}, Uptime: ${adminStats.body.data.systemHealth.uptimeHuman}`);

  // 5. Admin User Management & Role Updates
  console.log("\n[5] Testing Admin User Management (/api/admin/users)...");
  const adminUsers = await request("/api/admin/users", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminUsers.status, 200, "Admin users list must return 200 OK");
  assert.ok(Array.isArray(adminUsers.body.data), "Users list must be an array");
  console.log(`✅ Admin retrieved user list: ${adminUsers.body.data.length} registered users`);

  // 6. Admin Audit Logs
  console.log("\n[6] Testing Security Audit Logs (/api/admin/audit-logs)...");
  const auditLogs = await request("/api/admin/audit-logs", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(auditLogs.status, 200, "Audit logs must return 200 OK");
  assert.ok(Array.isArray(auditLogs.body.data), "Audit logs must be an array");
  console.log(`✅ Admin retrieved ${auditLogs.body.data.length} audit log entries`);

  // 7. Single Logout & Token Invalidation
  console.log("\n[7] Testing Logout and Token Invalidation...");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(logoutRes.status, 200, "Logout should return 200 OK");
  assert.strictEqual(logoutRes.body.success, true, "Logout should succeed");
  console.log("✅ User logged out successfully");

  const meAfterLogout = await request("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(meAfterLogout.status, 401, "Token should now be invalid / 401 Unauthorized");
  console.log("✅ Revoked token confirmed invalid (HTTP 401 Unauthorized)");

  console.log("\n=================================================");
  console.log("🎉 ALL E2E ENDPOINTS AND SECURITY POLICIES VERIFIED!");
  console.log("=================================================");
}

runE2EVerification().catch((err) => {
  console.error("❌ E2E verification failed:", err);
  process.exit(1);
});
