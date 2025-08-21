// components/onboarding/Birthdate.tsx
import { UseFormReturn } from "react-hook-form";
import type { FormValues } from "../../lib/forms";

export default function Birthdate({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="grid">
      <label className="label">Birthdate</label>
      <input className="input" type="date" {...form.register("Birthdate.date")} />
    </div>
  );
}
