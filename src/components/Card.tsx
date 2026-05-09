import React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`card ${className}`}>{children}</section>;
}


