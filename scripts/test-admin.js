// scripts/test-admin.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "../service-account.json");

if (!fs.existsSync(keyPath)) {
  console.error("❌ Key file not found at:", keyPath);
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  async function run() {
    try {
      console.log("⚡ Connected to Firebase Admin!");
      console.log("Fetching 'adminUsers' collection...");
      const snap = await db.collection("adminUsers").get();
      console.log(`✅ Success! Found ${snap.size} admin users:`);
      snap.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, Username: ${data.username}, Role: ${data.role}, Active: ${data.isActive}`);
      });
      process.exit(0);
    } catch (error) {
      console.error("❌ Error querying adminUsers:", error);
      process.exit(1);
    }
  }

  run();
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error);
  process.exit(1);
}
