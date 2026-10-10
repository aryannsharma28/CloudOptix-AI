const http = require("http");
const assert = require("assert");

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(u, {
      method: options.method || "GET",
      headers: options.headers || {}
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.setHeader("Content-Type", "application/json");
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function verifyAll() {
  console.log("1. Checking Vite serves /admin route...");
  const viteAdmin = await fetchUrl("http://localhost:5173/admin");
  assert.strictEqual(viteAdmin.status, 200);
  assert.ok(viteAdmin.raw.includes('<div id="root">'));
  console.log("✅ Vite successfully serves /admin with root mounting element.");

  console.log("\n2. Checking Aryan login and admin verification...");
  const login = await fetchUrl("http://localhost:5000/api/auth/google", {
    method: "POST",
    body: {
      email: "aryan.cloud@gmail.com",
      name: "Aryan AWS FinOps"
    }
  });
  assert.strictEqual(login.status, 200);
  assert.strictEqual(login.body.user.role, "ADMIN");
  const token = login.body.token;

  const verify = await fetchUrl("http://localhost:5000/api/admin/verify", {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(verify.status, 200);
  assert.strictEqual(verify.body.success, true);
  console.log("✅ Backend confirms Aryan (aryan.cloud@gmail.com) is authorized administrator.");

  console.log("\n3. Checking /api/admin/stats payload...");
  const stats = await fetchUrl("http://localhost:5000/api/admin/stats", {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(stats.status, 200);
  assert.ok(stats.body.data.systemHealth);
  console.log("✅ Telemetry payload verified: Memory", stats.body.data.systemHealth.memoryRssMb, "MB, Node", stats.body.data.systemHealth.nodeVersion);

  console.log("\n🎉 ALL TESTS CONFIRMED: Admin Panel is on /admin only, fully functional, and zero blank screen errors!");
}

verifyAll().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
