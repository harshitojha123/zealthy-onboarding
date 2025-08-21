// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

type Row = {
  id: number;
  email: string;
  about: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  birthDate: string; // YYYY-MM-DD or ""
  onboardStep: number;
};

type Resp = { users: Row[] } | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });

    const rows: Row[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      about: u.about ?? "",
      street: u.street ?? "",
      city: u.city ?? "",
      state: u.state ?? "",
      zip: u.zip ?? "",
      birthDate: u.birthDate ? u.birthDate.toISOString().slice(0, 10) : "",
      onboardStep: u.onboardStep,
    }));

    return res.status(200).json({ users: rows });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load users" });
  }
}
