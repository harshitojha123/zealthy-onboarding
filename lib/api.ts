// lib/api.ts

// ---- Types ---------------------------------------------------------------

export type Step = "about" | "birthdate" | "address";

export type PageCfg = {
  pageNumber: number;        // we only use 2 and 3 for admin config
  components: Step[];        // lowercased ids: "about" | "birthdate" | "address"
};

export type AdminPages = {
  pages: PageCfg[];          // [{ pageNumber: 2, components: [...] }, { pageNumber: 3, components: [...] }]
};

export type OnboardingPayload = {
  email: string;
  password?: string; // required only when creating a new user
  AboutMe?:   { bio?: string };
  Birthdate?: { date?: string }; // YYYY-MM-DD
  Address?:   { line1?: string; line2?: string; city?: string; state?: string; zip?: string };
};

// ---- Internals -----------------------------------------------------------

const ALLOWED: ReadonlyArray<Step> = ["about", "birthdate", "address"] as const;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function isStep(x: unknown): x is Step {
  return typeof x === "string" && (ALLOWED as readonly string[]).includes(x);
}

/**
 * Normalize admin pages before sending to the API:
 * - keep only pages 2 and 3
 * - lowercase + dedupe components
 * - filter to allowed component ids
 * - ensure a component is not assigned to both pages
 * - sort pages by pageNumber
 * (The server will still enforce 1–2 components per page and other rules.)
 */
function normalizePages(pages: AdminPages["pages"]): PageCfg[] {
  const byPage = new Map<number, Step[]>();
  const seenGlobally = new Set<Step>();

  for (const p of Array.isArray(pages) ? pages : []) {
    const n = Number(p?.pageNumber);
    if (n !== 2 && n !== 3) continue;

    const bucket = byPage.get(n) ?? [];
    for (const raw of (Array.isArray(p.components) ? p.components : [])) {
      const c = String(raw).toLowerCase() as Step;
      if (!isStep(c)) continue;
      if (seenGlobally.has(c)) continue; // prevent assigning same component to both pages
      if (!bucket.includes(c)) bucket.push(c);
      seenGlobally.add(c);
    }
    byPage.set(n, bucket);
  }

  const out: PageCfg[] = [];
  for (const n of [2, 3] as const) {
    if (byPage.has(n)) {
      out.push({ pageNumber: n, components: byPage.get(n)! });
    } else {
      // keep the key with empty array; server will 400 if you try to save all-empty,
      // but having both pages present matches the API shape.
      out.push({ pageNumber: n, components: [] });
    }
  }

  return out.sort((a, b) => a.pageNumber - b.pageNumber);
}

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let detail: any = null;
    try { detail = await res.json(); } catch { /* ignore non-JSON bodies */ }

    // Prefer a useful server-provided message; fall back to zod details or generic.
    const msg =
      detail?.message ??
      (detail?.errors
        ? (typeof detail.errors === "string" ? detail.errors : JSON.stringify(detail.errors))
        : undefined) ??
      detail?.error ??
      `HTTP ${res.status}`;

    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ---- Public API ----------------------------------------------------------

/** SWR-friendly loader. Example: useSWR("/api/config", getAdminConfig). */
export async function getAdminConfig(url: string | URL = "/api/config"): Promise<AdminPages> {
  return jsonFetch<AdminPages>(url, { cache: "no-store" });
}

/** Replace the entire admin config (pages 2 & 3). Business rules are enforced server-side. */
export async function updateAdminConfigPages(pages: AdminPages["pages"]): Promise<AdminPages> {
  const payload = { pages: normalizePages(pages) };
  return jsonFetch<AdminPages>("/api/config", {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

/** Submit the onboarding form to your API. */
export async function submitOnboarding(payload: OnboardingPayload): Promise<{ id: string | number }> {
  return jsonFetch<{ id: string | number }>("/api/onboarding", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}
