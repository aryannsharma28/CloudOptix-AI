const http = require("http");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

async function main() {
  const rootRes = await fetchUrl("http://localhost:5173/");
  console.log("Root / status:", rootRes.status, "HTML length:", rootRes.body.length);

  const adminRes = await fetchUrl("http://localhost:5173/admin");
  console.log("Route /admin status:", adminRes.status, "HTML length:", adminRes.body.length);
  console.log("Has root div:", adminRes.body.includes('id="root"'));
}

main().catch(console.error);
