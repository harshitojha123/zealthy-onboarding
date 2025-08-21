// pages/admin.tsx
import * as React from "react";
import useSWR from "swr";
import {
  getAdminConfig,
  updateAdminConfigPages,
  type Step,
  type AdminPages,
} from "../lib/api";

const ALL: Step[] = ["about", "birthdate", "address"];

export default function AdminPage() {
  // ✅ no implicit-any: pass the typed fetcher directly
  const { data, error, mutate } = useSWR<AdminPages>("/api/config", getAdminConfig);

  const [p2, setP2] = React.useState<Step[]>([]);
  const [p3, setP3] = React.useState<Step[]>([]);
  const [saving, setSaving] = React.useState<2 | 3 | null>(null);

  // hydrate local state from server
  React.useEffect(() => {
    if (!data) return;
    setP2(data.pages.find((p) => p.pageNumber === 2)?.components ?? []);
    setP3(data.pages.find((p) => p.pageNumber === 3)?.components ?? []);
  }, [data]);

  const toggle = (page: 2 | 3, step: Step) => {
    const [list, setList] = page === 2 ? [p2, setP2] : [p3, setP3];
    const next = list.includes(step) ? list.filter((s) => s !== step) : [...list, step];
    setList(next);
  };

  // ensure component is only on one page
  function dedupeAcrossPages(a: Step[], b: Step[]): [Step[], Step[]] {
    const aUniq: Step[] = [];
    for (const s of a) if (!aUniq.includes(s)) aUniq.push(s);
    const bUniq: Step[] = [];
    for (const s of b) if (!bUniq.includes(s) && !aUniq.includes(s)) bUniq.push(s);
    return [aUniq, bUniq];
  }

  async function save(page: 2 | 3) {
    try {
      setSaving(page);

      // merge with server’s current value for the page you didn’t edit
      const server2 = data?.pages.find((p) => p.pageNumber === 2)?.components ?? [];
      const server3 = data?.pages.find((p) => p.pageNumber === 3)?.components ?? [];
      const final2 = page === 2 ? p2 : (p2.length ? p2 : server2);
      const final3 = page === 3 ? p3 : (p3.length ? p3 : server3);

      // business rule: both pages must have at least one component
      if (!final2.length || !final3.length) {
        alert("Each page (Step 2 and Step 3) must have at least one component.");
        return;
      }

      const [out2, out3] = dedupeAcrossPages(final2, final3);

      const updated = await updateAdminConfigPages([
        { pageNumber: 2, components: out2 },
        { pageNumber: 3, components: out3 },
      ]);

      // update SWR cache so main page reflects immediately
      await mutate(updated, { revalidate: false });
      alert(`Saved Step ${page}.`);
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : "Failed to save"}`);
    } finally {
      setSaving(null);
    }
  }

  if (error) return <main className="p-6 text-red-600">Failed to load config.</main>;
  if (!data) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 space-y-10">
      <h1 className="text-3xl font-bold">Admin</h1>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Step 2</h2>
        {ALL.map((s) => (
          <label key={`2-${s}`} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={p2.includes(s)}
              onChange={() => toggle(2, s)}
            />
            <span>{s}</span>
          </label>
        ))}
        <div>
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => save(2)}
            disabled={saving !== null}
          >
            Save Step 2
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Step 3</h2>
        {ALL.map((s) => (
          <label key={`3-${s}`} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={p3.includes(s)}
              onChange={() => toggle(3, s)}
            />
            <span>{s}</span>
          </label>
        ))}
        <div>
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => save(3)}
            disabled={saving !== null}
          >
            Save Step 3
          </button>
        </div>
      </section>
    </main>
  );
}
