// pages/api/onboarding.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { buildSubmissionSchema, StepIds, type StepId } from "../../lib/validation";

// Map DB strings (lowercase) -> validation StepIds (TitleCase)
const toStepId: Record<string, StepId> = {
  address: "Address",
  birthdate: "Birthdate",
  about: "AboutMe",
};

type Payload = {
  email: string;
  password?: string; // required only when creating a new user
  Address?: { line1?: string; line2?: string; city?: string; state?: string; zip?: string };
  Birthdate?: { date?: string }; // YYYY-MM-DD
  AboutMe?: { bio?: string };
};

// Load enabled steps from ComponentConfig; fallback to all three if empty.
async function getEnabledSteps(): Promise<StepId[]> {
  const rows = await prisma.componentConfig.findMany({
    orderBy: [{ pageNumber: "asc" }, { component: "asc" }],
  });

  const enabled =
    rows.length > 0
      ? Array.from(
          new Set(
            rows
              .map((r) => (r.component ?? "").toLowerCase())
              .filter((s) => s in toStepId)
              .map((s) => toStepId[s as keyof typeof toStepId])
          )
        )
      : (["Address", "Birthdate", "AboutMe"] as StepId[]);

  // Keep only values that exist in StepIds
  return enabled.filter((s): s is StepId => (StepIds as readonly string[]).includes(s));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // 1) Respect admin config
  const enabled = await getEnabledSteps();
  if (enabled.length === 0) {
    return res.status(409).json({ message: "No steps are enabled by admin." });
  }

  // 2) Validate body by enabled steps (and allow extra keys via .passthrough() in buildSubmissionSchema)
  const schema = buildSubmissionSchema(enabled);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.format() });
  }

  const body = req.body as Payload;
  if (!body?.email) {
    return res.status(400).json({ message: "email is required" });
  }

  // 3) Build a plain patch object usable for BOTH create and update
  const birthDate =
    body.Birthdate?.date && /^\d{4}-\d{2}-\d{2}$/.test(body.Birthdate.date)
      ? new Date(`${body.Birthdate.date}T00:00:00.000Z`)
      : null;

  const patch: {
    about: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    birthDate: Date | null;
  } = {
    about: body.AboutMe?.bio ?? null,
    street: body.Address?.line1 ?? null,
    city: body.Address?.city ?? null,
    state: body.Address?.state ?? null,
    zip: body.Address?.zip ?? null,
    birthDate,
  };

  // 4) Create or update user
  const existing = await prisma.user.findUnique({ where: { email: body.email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: body.email },
      data: {
        ...patch,
        ...(body.password ? { password: body.password } : {}),
        onboardStep: 999,
      },
    });
    return res.status(200).json({ id: updated.id });
  }

  // Creating a new user requires a password
  if (!body.password) {
    return res.status(400).json({ message: "password is required to create a new user" });
  }

  const created = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password, // hash in production
      ...patch,
      onboardStep: 999,
    },
  });
  return res.status(200).json({ id: created.id });
}
