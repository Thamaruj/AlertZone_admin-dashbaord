"use client";

import { useState } from "react";
import ConnectionTest from "./test-connection/page";
import AdminLogin from "./components/Adminlogin";
import Maindashboard from "./components/Maindashboard";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
      {!isAuthenticated ? (
        <AdminLogin onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <Maindashboard />
      )}
    </>
  );
}