// components/onboarding/Address.tsx
import { UseFormReturn } from "react-hook-form";
import type { FormValues } from "../../lib/forms";

export default function Address({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="grid">
      <label className="label">Address</label>
      <div className="row">
        <input className="input" placeholder="Line 1" {...form.register("Address.line1")} />
        <input className="input" placeholder="Line 2" {...form.register("Address.line2")} />
      </div>
      <div className="grid grid-3">
        <input className="input" placeholder="City" {...form.register("Address.city")} />
        <input className="input" placeholder="State" {...form.register("Address.state")} />
        <input className="input" placeholder="ZIP" {...form.register("Address.zip")} />
      </div>
    </div>
  );
}
