// components/onboarding/AboutMe.tsx
import { UseFormReturn } from "react-hook-form";

type Props = { form: UseFormReturn<any> };

export default function AboutMe({ form }: Props) {
  return (
    <div className="grid">
      <label className="label" htmlFor="aboutMeBio">About Me</label>

      <textarea
        id="aboutMeBio"
        className="textarea"
        placeholder="Tell us about yourself"
        {...form.register("AboutMe.bio")}
      />

      <p className="helper">A short intro helps us personalize your experience.</p>
    </div>
  );
}
