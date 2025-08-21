// pages/admin.tsx
import * as React from "react";
import useSWR from "swr";
import {
  getAdminConfig,
  updateAdminConfigPages,
  type Step,
  type AdminPages,
} from "../lib/api";

const ALL: Step[] = ["about", "address", "birthdate"];
const LABEL: Record<Step, string> = {
  about: "about",
  address: "address",
  birthdate: "birthdate",
};

export default function AdminPage() {
  const { data, error, mutate } = useSWR<AdminPages>("/api/config", (url) =>
    getAdminConfig(url)
  );

  // Local checkbox state for each page
  const [p2, setP2] = React.useState<Step[]>([]);
  const [p3, setP3] = React.useState<Step[]>([]);
  const [saving, setSaving] = React.useState<2 | 3 | null>(null);

  // Hydrate from API
  React.useEffect(() => {
    if (!data) return;
    setP2(data.pages.find((p) => p.pageNumber === 2)?.components ?? []);
    setP3(data.pages.find((p) => p.pageNumber === 3)?.components ?? []);
  }, [data]);

  // Basic toggle
  function toggle(page: 2 | 3, step: Step) {
    const upd = (arr: Step[]) =>
      arr.includes(step) ? arr.filter((s) => s !== step) : [...arr, step];
    if (page === 2) setP2((prev) => upd(prev));
    else setP3((prev) => upd(prev));
  }

  // Save both pages each time (simple and keeps business rule intact)
  async function save(page: 2 | 3) {
    // Enforce: each of pages 2 & 3 must have at least one component
    if (p2.length === 0 || p3.length === 0) {
      alert("Each page (Step 2 and Step 3) must have at least one component.");
      return;
    }
    try {
      setSaving(page);
      const pages: AdminPages["pages"] = [
        { pageNumber: 2, components: dedupe(p2) },
        { pageNumber: 3, components: dedupe(p3) },
      ];
      const updated = await updateAdminConfigPages(pages);

      // Update SWR cache immediately so the main page reflects changes
      await mutate(updated, { revalidate: false });
      alert(`Saved Step ${page}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      alert(`Error: ${msg}`);
    } finally {
      setSaving(null);
    }
  }

  if (error) return <main className="container"><p className="error">Failed to load config.</p></main>;
  if (!data) return <main className="container"><p className="helper">Loading…</p></main>;

  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1 style={{ margin: "0 0 18px 0", fontSize: 42, fontWeight: 800 }}>Admin</h1>

      {/* STEP 2 */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 32, fontWeight: 700 }}>Step 2</h2>
        <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
          {ALL.map((s) => (
            <label key={`p2-${s}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={p2.includes(s)}
                onChange={() => toggle(2, s)}
              />
              <span style={{ fontSize: 18 }}>{LABEL[s]}</span>
            </label>
          ))}
        </div>
        <button
          onClick={() => save(2)}
          disabled={saving !== null}
          style={{ padding: "6px 12px" }}
        >
          Save Step 2
        </button>
      </section>

      {/* STEP 3 */}
      <section>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 32, fontWeight: 700 }}>Step 3</h2>
        <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
          {ALL.map((s) => (
            <label key={`p3-${s}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={p3.includes(s)}
                onChange={() => toggle(3, s)}
              />
              <span style={{ fontSize: 18 }}>{LABEL[s]}</span>
            </label>
          ))}
        </div>
        <button
          onClick={() => save(3)}
          disabled={saving !== null}
          style={{ padding: "6px 12px" }}
        >
          Save Step 3
        </button>
      </section>
    </main>
  );
}

// small helper
function dedupe(arr: Step[]): Step[] {
  return Array.from(new Set(arr));
}
