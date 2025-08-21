// components/onboarding/AboutMe.tsx
import { UseFormReturn } from "react-hook-form";
import type { FormValues } from "../../lib/forms";

export default function AboutMe({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="grid">
      <label className="label">About Me</label>
      <textarea
        className="textarea"
        placeholder="Tell us about yourself"
        {...form.register("AboutMe.bio")}
      />
      <p className="helper">A short intro helps us personalize your experience.</p>
    </div>
  );
}
