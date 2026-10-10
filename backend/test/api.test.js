const assert = require("assert");
const awsCollectorService = require("../src/services/awsCollectorService");
const mlClientService = require("../src/services/mlClientService");
const authService = require("../src/services/authService");

async function runTests() {
  console.log("🧪 Running CloudOptix Backend Test Suite...\n");

  // Test 1: AWS Mode & Disconnect Behavior
  const disconnectRes = awsCollectorService.disconnect();
  assert.strictEqual(disconnectRes.mode, "DISCONNECTED", "Disconnect must set mode to DISCONNECTED");
  assert.strictEqual(awsCollectorService.getAccountInfo(), null, "Disconnected account info must be null");
  console.log("✅ Test 1: AWS connection lifecycle and disconnect verified.");

  // Test 2: Disconnected Resource Collector
  const resourcesResult = await awsCollectorService.fetchActiveResources();
  assert.strictEqual(resourcesResult.mode, "DISCONNECTED", "Resource fetch must return DISCONNECTED");
  assert(Array.isArray(resourcesResult.resources), "Resources must be an array");
  assert.strictEqual(resourcesResult.resources.length, 0, "Disconnected resources must be empty");
  console.log("✅ Test 2: Disconnected AWS resource collection verified.");

  // Test 3: Disconnected Cost Summary Engine
  const summary = await awsCollectorService.getSummary();
  assert.strictEqual(summary.monthlyCost, 0, "Monthly cost must be 0 when disconnected");
  assert(summary.costBreakdown !== undefined, "Cost breakdown must be present");
  console.log("✅ Test 3: Disconnected spend aggregation verified.");

  // Test 4: Disconnected Security & Compliance Audit
  const secChecks = await awsCollectorService.getSecurityChecks();
  assert.strictEqual(secChecks.length, 0, "Security scanner must return 0 checks when disconnected");
  console.log("✅ Test 4: Disconnected AWS Security & Compliance audit verified.");

  // Test 5: Predictive ML Forecast Engine
  const forecast = await mlClientService.getCostForecast(summary.historicalTrend);
  assert(forecast.forecastPoints.length >= 3, "Must produce multiple forecast periods");
  console.log("✅ Test 5: Predictive ML forecast engine verified.");

  // Test 6: Phone Number OTP Generator & Verification
  const testPhone = "+919811122233";
  const otpResult = authService.sendPhoneOtp(testPhone);
  assert.strictEqual(otpResult.success, true, "OTP must generate successfully");
  assert.strictEqual(otpResult.otp.length, 6, "OTP must be exactly 6 digits");

  const verifyResult = authService.verifyPhoneOtp(testPhone, otpResult.otp, "Test Engineer");
  assert.strictEqual(verifyResult.success, true, "Valid OTP must authenticate user");
  assert(verifyResult.token.startsWith("coptix_"), "Must return secure session token");
  assert.strictEqual(verifyResult.user.name, "Test Engineer", "User name must match");
  console.log("✅ Test 6: Phone number 6-digit OTP generator & verification verified.");

  // Test 7: Google (Gmail) Sign-In & Session Verification
  const googleResult = authService.googleSignIn({
    email: "lead.finops@gmail.com",
    name: "FinOps Lead",
    picture: "https://example.com/avatar.jpg"
  });
  assert.strictEqual(googleResult.success, true, "Google login must succeed");
  assert.strictEqual(googleResult.user.email, "lead.finops@gmail.com", "Email must be preserved");

  const sessionUser = authService.getUserByToken(googleResult.token);
  assert.strictEqual(sessionUser.id, googleResult.user.id, "Session token must resolve to user");
  console.log("✅ Test 7: Google (Gmail) sign-in & active session verification verified.");

  // Test 8: Logout & Session Invalidation
  const logoutRes = authService.logout(googleResult.token);
  assert.strictEqual(logoutRes.success, true, "Logout must succeed");
  const invalidatedUser = authService.getUserByToken(googleResult.token);
  assert.strictEqual(invalidatedUser, null, "Invalidated session must return null");
  console.log("✅ Test 8: Session logout & token revocation verified.");

  // Test 9: Password Authentication & Default Admin Account
  const adminLogin = authService.loginWithPassword({
    email: "admin@cloudoptix.ai",
    password: "Admin@12345"
  });
  assert.strictEqual(adminLogin.success, true, "Admin password authentication must succeed");
  assert.strictEqual(authService.isAdmin(adminLogin.user), true, "Admin user must have admin status");
  console.log("✅ Test 9: Enterprise password auth & default admin verification verified.");

  // Test 10: Role-Based Access Control (Admin vs Standard User)
  const testEmail = `test.standard_${Date.now()}@cloudoptix.ai`;
  const regUser = authService.registerWithPassword({
    email: testEmail,
    password: "StandardPassword123",
    name: "Standard FinOps Analyst",
    role: "USER"
  });
  assert.strictEqual(authService.isAdmin(regUser.user), false, "Standard user must NOT have admin access");
  console.log("✅ Test 10: Role-based access control (RBAC) rejection for non-admins verified.");

  console.log("\n🎉 All 10 test suites passed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
