// scripts/count-lgas.ts
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { resolveSrilankaRegion } from "../lib/constants/sriLankaRegions";

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
      const snap = await db.collection("reports").get();
      const lgaCounts: Record<string, number> = {};
      
      snap.forEach(doc => {
        const data = doc.data();
        const loc = data.location || {};
        const addressObj = {
          region: loc.region || "",
          district: loc.district || "",
          subregion: loc.subregion || "",
          city: loc.city || "",
          name: loc.name || "",
          street: loc.street || ""
        };
        const resolved = resolveSrilankaRegion(
          addressObj,
          loc.address || loc.area || "",
          typeof loc.latitude === "number" ? loc.latitude : parseFloat(loc.latitude),
          typeof loc.longitude === "number" ? loc.longitude : parseFloat(loc.longitude)
        );
        const lgaKey = `${resolved.province} -> ${resolved.district} -> ${resolved.localGovernmentArea}`;
        lgaCounts[lgaKey] = (lgaCounts[lgaKey] || 0) + 1;
        
        console.log(`Report ID: ${doc.id}`);
        console.log(`  Raw Location:`, JSON.stringify(data.location, null, 2));
        console.log(`  Resolved: ${lgaKey}`);
        console.log("-----------------------------------------");
      });
      
      console.log("\nResolved LGA Distribution (using centralized resolveSrilankaRegion):");
      const sortedKeys = Object.keys(lgaCounts).sort();
      for (const key of sortedKeys) {
        console.log(`- ${key}: ${lgaCounts[key]} report(s)`);
      }
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
