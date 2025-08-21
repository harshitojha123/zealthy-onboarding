// pages/onboarding/[step].tsx
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useFormContext } from "react-hook-form";
import { getAdminConfig, submitOnboarding, type Step } from "../../lib/api";
import Address from "../../components/onboarding/Address";
import Birthdate from "../../components/onboarding/Birthdate";
import AboutMe from "../../components/onboarding/AboutMe";

const LABEL: Record<Step, string> = {
  about: "About Me",
  birthdate: "Birthdate",
  address: "Address",
};

// ✅ Use React.ReactNode (or React.ReactElement) instead of JSX.Element
const registry: Record<Step, (p: { form: any }) => React.ReactNode> = {
  about:     ({ form }) => <AboutMe form={form} />,
  birthdate: ({ form }) => <Birthdate form={form} />,
  address:   ({ form }) => <Address form={form} />,
};

export default function OnboardingStep() {
  const router = useRouter();
  const form = useFormContext();
  const { getValues, formState } = form;

  const raw = Array.isArray(router.query.step) ? router.query.step[0] : router.query.step;
  const step = Math.max(1, Math.min(3, Number(raw) || 1));

  const { data, error } = useSWR("/api/config", (url) => getAdminConfig(url));

  const step2 = useMemo<Step[]>(
    () => (data?.pages.find((p) => p.pageNumber === 2)?.components ?? []) as Step[],
    [data]
  );
  const step3 = useMemo<Step[]>(
    () => (data?.pages.find((p) => p.pageNumber === 3)?.components ?? []) as Step[],
    [data]
  );

  function requiredFieldsFor(stepNum: 2 | 3): string[] {
    const comps = stepNum === 2 ? step2 : step3;
    const fields: string[] = [];
    if (comps.includes("address")) {
      fields.push("Address.line1", "Address.city", "Address.state", "Address.zip");
    }
    if (comps.includes("birthdate")) {
      fields.push("Birthdate.date");
    }
    return fields; // "about" optional
  }

  function isStepComplete(stepNum: 2 | 3) {
    const v = getValues();
    return requiredFieldsFor(stepNum).every((path) => {
      const val = path.split(".").reduce<any>((acc, k) => acc?.[k], v);
      return typeof val === "string" ? val.trim().length > 0 : Boolean(val);
    });
  }

  const totalSteps = 3;
  const pct = Math.round(((step - 1) / (totalSteps - 1)) * 100);

  useEffect(() => {
    const email = String(getValues("email") ?? "").trim();
    const password = String(getValues("password") ?? "").trim();
    if (step >= 2 && (!email || !password)) {
      router.replace("/");
      return;
    }
    if (step === 3 && !isStepComplete(2)) {
      router.replace("/onboarding/2");
      return;
    }
  }, [step, getValues, router]);

  async function next() {
    if (step === 1) {
      if (await form.trigger(["email", "password"])) router.push("/onboarding/2");
      return;
    }
    if (step === 2) {
      if (await form.trigger(requiredFieldsFor(2))) router.push("/onboarding/3");
      return;
    }
  }
  function back() {
    if (step > 1) router.push(`/onboarding/${step - 1}`);
  }

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const onSubmit = form.handleSubmit(async (values) => {
    const ok = await form.trigger([
      "email",
      "password",
      ...requiredFieldsFor(2),
      ...requiredFieldsFor(3),
    ]);
    if (!ok) {
      const email = String(getValues("email") ?? "").trim();
      const password = String(getValues("password") ?? "").trim();
      if (!email || !password) return router.push("/");
      if (!isStepComplete(2)) return router.push("/onboarding/2");
      return router.push("/onboarding/3");
    }

    try {
      setSaving(true);
      const pwd = String(values?.password ?? "").trim();
      await submitOnboarding({
        email: values?.email ?? "",
        ...(pwd ? { password: pwd } : {}),
        AboutMe: values?.AboutMe,
        Address: values?.Address,
        Birthdate: values?.Birthdate,
      });
      router.replace("/success");
    } catch (e: any) {
      setToast(`❌ ${e.message || "Failed to submit"}`);
      setTimeout(() => setToast(null), 2600);
    } finally {
      setSaving(false);
    }
  });

  if (error) return <div className="container"><p className="error">Failed to load config.</p></div>;
  if (!data) return <div className="container"><p className="helper">Loading…</p></div>;

  const compsThisStep = step === 2 ? step2 : step3;

  return (
    <div className="container shell">
      <div className="aura" /><div className="aura a2" />
      <h1 className="header">Onboarding</h1>

      <div className="card">
        <div className="stepper">
          <div className="chip"><span className="num">1</span><span>Account</span></div>
          <div className="chip"><span className="num">2</span><span>{step2.map(s => LABEL[s]).join(" & ") || "—"}</span></div>
          <div className="chip"><span className="num">3</span><span>{step3.map(s => LABEL[s]).join(" & ") || "—"}</span></div>
        </div>

        <div className="progress" aria-label="Progress">
          <div className="progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress__label">Step {step} of {totalSteps}</span>

        <form className="grid" onSubmit={onSubmit}>
          {step === 1 && (
            <section className="section">
              <h2>Account</h2>

              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="you@example.com"
                {...form.register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/, message: "Enter a valid email" },
                })}
              />
              {formState.errors?.email && <p className="error">{String(formState.errors.email.message)}</p>}

              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="••••••••"
                {...form.register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                })}
              />
              {formState.errors?.password && <p className="error">{String(formState.errors.password.message)}</p>}
            </section>
          )}

          {(step === 2 || step === 3) && compsThisStep.map((s) => {
            const Comp = registry[s];
            return (
              <section key={s} className="section">
                <h2>{LABEL[s]}</h2>
                <Comp form={form} />
              </section>
            );
          })}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {step > 1 && <button type="button" className="button" onClick={back}>← Back</button>}
            {step < 3 && <button type="button" className="button" onClick={next}>Next →</button>}
            {step === 3 && (
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </form>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
