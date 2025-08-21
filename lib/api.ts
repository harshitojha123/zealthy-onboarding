// lib/api.ts
export type Step = "about" | "birthdate" | "address";
export type PageCfg = { pageNumber: number; components: Step[] };
export type AdminPages = { pages: PageCfg[] };

export type OnboardingPayload = {
  email: string;
  password?: string;
  AboutMe?: { bio?: string };
  Birthdate?: { date?: string };
  Address?: { line1?: string; line2?: string; city?: string; state?: string; zip?: string };
};

const ALLOWED: ReadonlyArray<Step> = ["about", "birthdate", "address"] as const;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function isStep(x: unknown): x is Step {
  return typeof x === "string" && (ALLOWED as readonly string[]).includes(x);
}

function normalizePages(pages: AdminPages["pages"]): PageCfg[] {
  const safePages = Array.isArray(pages) ? pages : [];
  const normalized = safePages
    .map((p) => {
      const n = Number(p.pageNumber);
      const comps = (Array.isArray(p.components) ? p.components : [])
        .map((c) => String(c).toLowerCase())
        .filter(isStep);
      const uniq: Step[] = [];
      for (const c of comps) if (!uniq.includes(c)) uniq.push(c);
      return { pageNumber: Number.isFinite(n) && n > 0 ? n : 1, components: uniq };
    })
    .filter((p) => p.components.length > 0)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  return normalized;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      /* ignore non-JSON */
    }
    const msg =
      (isRecord(detail) && typeof detail.message === "string" && detail.message) ||
      (isRecord(detail) && typeof detail.error === "string" && detail.error) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function getAdminConfig(url: string | URL = "/api/config"): Promise<AdminPages> {
  return jsonFetch<AdminPages>(url, { cache: "no-store" });
}
export async function updateAdminConfigPages(pages: AdminPages["pages"]): Promise<AdminPages> {
  const payload = { pages: normalizePages(pages) };
  return jsonFetch<AdminPages>("/api/config", {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}
export async function submitOnboarding(payload: OnboardingPayload): Promise<{ id: string | number }> {
  return jsonFetch<{ id: string | number }>("/api/onboarding", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}
