// scripts/test-api-http.js
const http = require("http");

const PORT = 3000;
const HOST = "localhost";

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function test() {
  try {
    console.log("🔑 Logging in as superadmin...");
    const loginData = JSON.stringify({
      username: "superadmin",
      password: "admin1234"
    });

    const loginRes = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(loginData)
      }
    }, loginData);

    console.log(`Login response status: ${loginRes.statusCode}`);
    if (loginRes.statusCode !== 200) {
      console.error("❌ Login failed:", loginRes.body);
      return;
    }

    const setCookie = loginRes.headers["set-cookie"];
    if (!setCookie || setCookie.length === 0) {
      console.error("❌ No Set-Cookie header found in login response!");
      return;
    }

    const cookieStr = setCookie[0].split(";")[0];
    console.log(`✅ Login successful! Cookie obtained: ${cookieStr.substring(0, 30)}...`);

    console.log("\n📊 Fetching /api/analytics...");
    const analyticsRes = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: "/api/analytics?range=30",
      method: "GET",
      headers: {
        "Cookie": cookieStr
      }
    });
    console.log(`Analytics response status: ${analyticsRes.statusCode}`);
    if (analyticsRes.statusCode === 200) {
      console.log("✅ Analytics fetched successfully!");
    } else {
      console.error("❌ Analytics fetch failed:", analyticsRes.body);
    }

    console.log("\n📋 Fetching /api/reports...");
    const reportsRes = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: "/api/reports",
      method: "GET",
      headers: {
        "Cookie": cookieStr
      }
    });
    console.log(`Reports response status: ${reportsRes.statusCode}`);
    if (reportsRes.statusCode === 200) {
      console.log("✅ Reports fetched successfully!");
      const body = JSON.parse(reportsRes.body);
      console.log(`Found ${body.reports?.length} reports.`);
    } else {
      console.error("❌ Reports fetch failed:", reportsRes.body);
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

test();
