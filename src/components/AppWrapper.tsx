import React from "react";
import { EstadoPremiumProvider } from "../context/EstadoPremiumUser";
import Navbar from "./Navbar";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <EstadoPremiumProvider>
      <Navbar />
      {children}
    </EstadoPremiumProvider>
  );
}
