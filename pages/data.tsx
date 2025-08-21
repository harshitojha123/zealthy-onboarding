import * as React from "react";
import useSWR from "swr";

type Row = {
  id: number | string;
  email: string;
  about: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  birthDate: string | null;
  onboardStep: number;
};

type Api = { users: Row[] };

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  });

export default function DataPage() {
  const { data, error, isLoading, mutate } = useSWR<Api, Error>("/api/users", fetcher);

  return (
    <div className="container shell">
      <div className="aura" /><div className="aura a2" />
      <h1 className="header">Data (no auth)</h1>

      <div className="card">
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button className="button" onClick={() => mutate()}>Refresh</button>
        </div>

        {isLoading && <p className="helper">Loading…</p>}
        {error && <p className="error">Failed to load: {error.message}</p>}

        {!isLoading && !error && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ID","Email","About","Street","City","State","ZIP","Birthdate","Onboard Step"].map(h => (
                    <th key={h} style={{ textAlign:"left", padding:"10px", borderBottom:"1px solid var(--border)", fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.users.map((u) => (
                  <tr key={u.id}>
                    <td style={td}>{u.id}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{u.about ?? "—"}</td>
                    <td style={td}>{u.street ?? "—"}</td>
                    <td style={td}>{u.city ?? "—"}</td>
                    <td style={td}>{u.state ?? "—"}</td>
                    <td style={td}>{u.zip ?? "—"}</td>
                    <td style={td}>{u.birthDate ?? "—"}</td>
                    <td style={td}>{u.onboardStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
const td: React.CSSProperties = { padding: "10px", borderBottom: "1px solid var(--border)", verticalAlign: "top", whiteSpace: "nowrap" };
