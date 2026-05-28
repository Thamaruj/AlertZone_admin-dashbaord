// scripts/test-get-reports.js
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
      console.log("Fetching 'reports' collection ordered by createdAt desc...");
      const snapshot = await db.collection("reports").orderBy("createdAt", "desc").get();
      console.log(`✅ Success! Found ${snapshot.size} reports.`);

      let count = 0;
      const reports = snapshot.docs.map((doc) => {
        count++;
        const data = doc.data();
        
        try {
          const createdAt = data.createdAt?.toDate 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt;

          const updatedAt = data.updatedAt?.toDate 
            ? data.updatedAt.toDate().toISOString() 
            : data.updatedAt;

          const statusHistory = (data.statusHistory || []).map((history, hidx) => {
            if (!history) {
              throw new Error(`Null/undefined history entry at index ${hidx}`);
            }
            return {
              ...history,
              changedAt: history.changedAt?.toDate 
                ? history.changedAt.toDate().toISOString() 
                : history.changedAt,
            };
          });

          return {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
            statusHistory,
          };
        } catch (innerError) {
          console.error(`❌ Error parsing report doc ID ${doc.id} (index ${count}):`, innerError);
          console.error("Document data:", JSON.stringify(data, null, 2));
          throw innerError;
        }
      });

      console.log(`✅ Parsed ${reports.length} reports successfully!`);
      process.exit(0);
    } catch (error) {
      console.error("❌ Error querying reports:", error);
      process.exit(1);
    }
  }

  run();
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error);
  process.exit(1);
}
