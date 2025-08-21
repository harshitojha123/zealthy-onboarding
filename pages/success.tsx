// pages/success.tsx
import * as React from "react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="container shell">
      <div className="aura" /><div className="aura a2" />
      <h1 className="header">All set!</h1>

      <div className="card" style={{ textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>
          Thank you — your data has been successfully submitted.
        </h2>
        <p className="helper">You can verify it any time at <code>/data</code>.</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
          {/* Only one action now */}
          <Link href="/" className="button">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
