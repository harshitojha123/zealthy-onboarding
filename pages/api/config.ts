// pages/api/config.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const ALLOWED = ["about", "birthdate", "address"] as const;
type Step = (typeof ALLOWED)[number];

const InputSchema = z.object({
  pages: z.array(
    z.object({
      pageNumber: z.number().int(),
      components: z.array(z.string()),
    })
  ),
});

// Defaults when DB is empty
const DEFAULT_PAGES: { pageNumber: number; components: Step[] }[] = [
  { pageNumber: 2, components: ["about", "birthdate"] },
  { pageNumber: 3, components: ["address"] },
];

function normalizePages(input: { pageNumber: number; components: string[] }[]) {
  // Only pages 2 & 3; each component can appear on exactly one page (no duplicates across pages)
  const byPage = new Map<number, Step[]>();
  const seen = new Set<Step>();

  for (const { pageNumber, components } of input) {
    if (pageNumber !== 2 && pageNumber !== 3) continue;

    const bucket: Step[] = [];
    for (const raw of components) {
      const c = String(raw).toLowerCase() as Step;
      if (!(ALLOWED as readonly string[]).includes(c)) continue;
      if (seen.has(c)) {
        return { error: `Component "${c}" cannot be assigned to more than one page.` };
      }
      if (!bucket.includes(c)) {
        bucket.push(c);
        seen.add(c);
      }
    }
    byPage.set(pageNumber, bucket);
  }

  // Ensure both pages exist
  for (const n of [2, 3] as const) if (!byPage.has(n)) byPage.set(n, []);

  const p2 = byPage.get(2)!;
  const p3 = byPage.get(3)!;

  // Business rules: at least one per page, at most two per page
  if (p2.length === 0 || p3.length === 0) {
    return { error: "Each of pages 2 and 3 must have at least one component." };
  }
  if (p2.length > 2 || p3.length > 2) {
    return { error: "Each page can have at most two components." };
  }

  return {
    pages: [
      { pageNumber: 2, components: p2 },
      { pageNumber: 3, components: p3 },
    ] as { pageNumber: number; components: Step[] }[],
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const rows = await prisma.componentConfig.findMany({
      orderBy: [{ pageNumber: "asc" }, { component: "asc" }],
    });

    if (rows.length === 0) {
      return res.status(200).json({ pages: DEFAULT_PAGES });
    }

    // group -> [{ pageNumber, components: Step[] }]
    const grouped = rows.reduce<Map<number, Step[]>>((map, r) => {
      const page = r.pageNumber;
      const comp = String(r.component || "").toLowerCase() as Step;
      if (!(ALLOWED as readonly string[]).includes(comp)) return map;
      if (!map.has(page)) map.set(page, []);
      const arr = map.get(page)!;
      if (!arr.includes(comp)) arr.push(comp);
      return map;
    }, new Map());

    const pages = [2, 3].map((n) => ({
      pageNumber: n,
      components: (grouped.get(n) ?? []) as Step[],
    }));

    return res.status(200).json({ pages });
  }

  if (req.method === "PUT") {
    const parsed = InputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    }

    const normalized = normalizePages(parsed.data.pages);
    if ("error" in normalized) {
      return res.status(400).json({ message: normalized.error });
    }

    // Replace table contents
    const data = normalized.pages.flatMap((p) =>
      p.components.map((c) => ({ pageNumber: p.pageNumber, component: c })),
    );

    await prisma.$transaction([
      prisma.componentConfig.deleteMany({}),
      prisma.componentConfig.createMany({ data }),
    ]);

    return res.status(200).json({ pages: normalized.pages });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).end("Method Not Allowed");
}
