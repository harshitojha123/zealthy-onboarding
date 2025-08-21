// lib/validation.ts
import { z } from "zod";

/** TitleCase section ids to match the payload keys */
export const StepIds = ["AboutMe", "Birthdate", "Address"] as const;
export type StepId = (typeof StepIds)[number];

export function buildSubmissionSchema(enabled: StepId[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  if (enabled.includes("AboutMe")) {
    shape.AboutMe = z
      .object({
        bio: z.string().min(3, "Please write at least 3 characters").optional(),
      })
      .partial()
      .optional();
  }

  if (enabled.includes("Birthdate")) {
    shape.Birthdate = z
      .object({
        date: z
          .string()
          .min(1, "Birthdate is required")
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
      })
      .optional(); // <-- optional so partial submit works
  }

  if (enabled.includes("Address")) {
    shape.Address = z
      .object({
        line1: z.string().min(3, "Street address is required"),
        line2: z.string().optional(),
        city: z.string().min(2, "City is required"),
        state: z.string().min(2, "State is required"),
        zip: z.string().min(3, "ZIP is required"),
      })
      .optional(); // <-- optional so partial submit works
  }

  // Allow extra top-level keys like email/password
  return z.object(shape).passthrough();
}
