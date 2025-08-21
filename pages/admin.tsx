// pages/admin.tsx
import * as React from "react";
import useSWR from "swr";
import { getAdminConfig, updateAdminConfigPages, type Step } from "../lib/api";

const ALL: Step[] = ["about", "address", "birthdate"]; // order to match your screenshot text

export default function AdminPage() {
  const { data, error, mutate } = useSWR("/api/config", (url) => getAdminConfig(url));
  const [p2, setP2] = React.useState<Set<Step>>(new Set());
  const [p3, setP3] = React.useState<Set<Step>>(new Set());
  const [saving, setSaving] = React.useState<null | "2" | "3">(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  // Hydrate from API
  React.useEffect(() => {
    if (!data) return;
    const two = new Set<Step>(data.pages.find(p => p.pageNumber === 2)?.components ?? []);
    const three = new Set<Step>(data.pages.find(p => p.pageNumber === 3)?.components ?? []);
    // If any duplicate slipped into DB, prefer step 2
    ALL.forEach(s => { if (two.has(s) && three.has(s)) three.delete(s); });
    setP2(two);
    setP3(three);
  }, [data]);

  // Toggle helpers — enforce global uniqueness: when a component
  // is checked on one page, it’s removed from the other page.
  function toggle(page: 2 | 3, comp: Step) {
    if (page === 2) {
      const next2 = new Set(p2);
      const next3 = new Set(p3);
      if (next2.has(comp)) next2.delete(comp);
      else { next2.add(comp); next3.delete(comp); }
      setP2(next2); setP3(next3);
    } else {
      const next2 = new Set(p2);
      const next3 = new Set(p3);
      if (next3.has(comp)) next3.delete(comp);
      else { next3.add(comp); next2.delete(comp); }
      setP2(next2); setP3(next3);
    }
  }

  const pageInvalid = (set: Set<Step>) => set.size === 0 || set.size > 2;

  async function save(which: "2" | "3") {
    try {
      setSaving(which);
      setMsg(null);

      if (pageInvalid(p2) || pageInvalid(p3)) {
        setMsg("Each page must have at least one and at most two components.");
        return;
      }

      await updateAdminConfigPages([
        { pageNumber: 2, components: Array.from(p2) },
        { pageNumber: 3, components: Array.from(p3) },
      ]);
      await mutate();
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  if (error) return <main style={{ padding: 24 }}>Failed to load config.</main>;
  if (!data) return <main style={{ padding: 24 }}>Loading…</main>;

  return (
    <main style={{ maxWidth: 520, margin: "20px auto", padding: "0 16px" }}>
      <h1>Admin</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Step 2</h2>
        {ALL.map(s => (
          <label key={`2-${s}`} style={{ display: "block", margin: "6px 0" }}>
            <input
              type="checkbox"
              checked={p2.has(s)}
              onChange={() => toggle(2, s)}
            />{" "}
            {s}
          </label>
        ))}
        <button
          onClick={() => save("2")}
          disabled={saving !== null || pageInvalid(p2)}
          style={{ marginTop: 6 }}
        >
          Save Step 2
        </button>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Step 3</h2>
        {ALL.map(s => (
          <label key={`3-${s}`} style={{ display: "block", margin: "6px 0" }}>
            <input
              type="checkbox"
              checked={p3.has(s)}
              onChange={() => toggle(3, s)}
            />{" "}
            {s}
          </label>
        ))}
        <button
          onClick={() => save("3")}
          disabled={saving !== null || pageInvalid(p3)}
          style={{ marginTop: 6 }}
        >
          Save Step 3
        </button>
      </section>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
