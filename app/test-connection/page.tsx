"use client"; // Required for using hooks like useEffect and useState

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ensure this path matches your lib folder

export default function ConnectionTest() {
  const [status, setStatus] = useState("🔄 Testing Firebase connection...");
  const [details, setDetails] = useState("");

  useEffect(() => {
    const runTest = async () => {
      try {
        // Attempting to sign in with the test credentials you created
        await signInWithEmailAndPassword(auth, "admin-test@alertzone.com", "password123");
        setStatus("✅ SUCCESS: Connected to AlertZone Firebase!");
        setDetails("The dashboard successfully authenticated with the cloud server.");
      } catch (error: any) {
        setStatus("❌ CONNECTION ERROR");
        setDetails(error.message);
        console.error("Firebase Test Error:", error);
      }
    };

    runTest();
  }, []);

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", display: "inline-block" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>AlertZone Connection Pulse</h1>
        <p style={{ fontSize: "18px", color: status.includes("✅") ? "green" : "red", fontWeight: "bold" }}>
          {status}
        </p>
        <p style={{ marginTop: "10px", color: "#666" }}>{details}</p>
      </div>
    </div>
  );
}