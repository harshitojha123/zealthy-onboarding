// components/onboarding/Birthdate.tsx
import { UseFormReturn } from "react-hook-form";

type Props = { form: UseFormReturn<any> };

export default function Birthdate({ form }: Props) {
  const { formState } = form;
  const e = formState.errors as any;

  return (
    <div className="grid">
      <label className="label" htmlFor="birthdate">Birthdate</label>
      <input
        id="birthdate"
        className="input"
        type="date"
        {...form.register("Birthdate.date", { required: "Birthdate is required" })}
      />
      {e?.Birthdate?.date && <p className="error">{e.Birthdate.date.message}</p>}
    </div>
  );
}
