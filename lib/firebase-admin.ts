import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      // Ensure private key newlines are parsed correctly
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("⚡ Firebase Admin SDK initialized via environment variable");
    } catch (error) {
      console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY environment variable:", error);
      throw error;
    }
  } else {
    // Fallback: Try reading local service-account.json
    const localKeyPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(localKeyPath)) {
      try {
        const localKeyRaw = fs.readFileSync(localKeyPath, "utf8");
        const serviceAccount = JSON.parse(localKeyRaw);
        
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("⚡ Firebase Admin SDK initialized via local service-account.json");
      } catch (error) {
        console.error("❌ Failed to parse local service-account.json:", error);
        throw error;
      }
    } else {
      console.error(
        "❌ Firebase Admin SDK Error: Neither FIREBASE_SERVICE_ACCOUNT_KEY env var nor service-account.json was found."
      );
      throw new Error("Missing Firebase Service Account credentials");
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin };
