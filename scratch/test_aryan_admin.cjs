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

async function verifyAryanAdmin() {
  console.log("Testing Aryan AWS FinOps login as Admin...");
  const loginRes = await request("/api/auth/google", {
    method: "POST",
    body: {
      email: "aryan.cloud@gmail.com",
      name: "Aryan AWS FinOps",
      picture: "https://ui-avatars.com/api/?name=Aryan"
    }
  });

  console.log("Login Status:", loginRes.status);
  console.log("Login User:", loginRes.body.user);
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.user.role, "ADMIN", "Role should now be ADMIN");

  const token = loginRes.body.token;

  console.log("\nVerifying /api/admin/verify with Aryan's token...");
  const verifyRes = await request("/api/admin/verify", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log("Verify Status:", verifyRes.status);
  console.log("Verify Body:", verifyRes.body);
  assert.strictEqual(verifyRes.status, 200, "Should return 200 OK");
  assert.strictEqual(verifyRes.body.success, true);

  console.log("\nVerifying /api/admin/stats with Aryan's token...");
  const statsRes = await request("/api/admin/stats", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log("Stats Status:", statsRes.status);
  console.log("Stats Data:", statsRes.body.data.systemHealth);
  assert.strictEqual(statsRes.status, 200, "Should return 200 OK");

  console.log("\nVerifying a real non-admin user still gets 403 Forbidden...");
  const normalUserLogin = await request("/api/auth/google", {
    method: "POST",
    body: {
      email: "regular.employee@company.com",
      name: "Regular Employee"
    }
  });
  const normalToken = normalUserLogin.body.token;
  const normalVerify = await request("/api/admin/verify", {
    method: "GET",
    headers: { Authorization: `Bearer ${normalToken}` }
  });
  console.log("Normal User Verify Status:", normalVerify.status);
  console.log("Normal User Body:", normalVerify.body);
  assert.strictEqual(normalVerify.status, 403, "Normal user must still be rejected with 403 Forbidden");

  console.log("\n🎉 ALL TESTS PASSED! Aryan is authorized Admin, and regular users remain strictly 403 Forbidden!");
}

verifyAryanAdmin().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
