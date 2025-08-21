// components/onboarding/Address.tsx
import { UseFormReturn } from "react-hook-form";

export default function Address({ form }: { form: UseFormReturn<any> }) {
  const { formState } = form;
  const e = formState.errors as any;

  return (
    <div className="grid">
      <label className="label">Address</label>

      <div className="row">
        <div>
          <input
            className="input"
            placeholder="Line 1"
            {...form.register("Address.line1", { required: "Street address is required" })}
          />
          {e?.Address?.line1 && <p className="error">{e.Address.line1.message}</p>}
        </div>
        <input
          className="input"
          placeholder="Line 2"
          {...form.register("Address.line2")}
        />
      </div>

      <div className="grid grid-3">
        <div>
          <input
            className="input"
            placeholder="City"
            {...form.register("Address.city", { required: "City is required" })}
          />
          {e?.Address?.city && <p className="error">{e.Address.city.message}</p>}
        </div>
        <div>
          <input
            className="input"
            placeholder="State"
            {...form.register("Address.state", { required: "State is required" })}
          />
          {e?.Address?.state && <p className="error">{e.Address.state.message}</p>}
        </div>
        <div>
          <input
            className="input"
            placeholder="ZIP"
            {...form.register("Address.zip", { required: "ZIP is required" })}
          />
          {e?.Address?.zip && <p className="error">{e.Address.zip.message}</p>}
        </div>
      </div>
    </div>
  );
}
