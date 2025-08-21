// pages/onboarding/[step].tsx
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useFormContext, type FieldPath, type UseFormReturn } from "react-hook-form";
import { getAdminConfig, submitOnboarding, type AdminPages, type Step } from "../../lib/api";
import type { FormValues } from "../../lib/forms";
import Address from "../../components/onboarding/Address";
import Birthdate from "../../components/onboarding/Birthdate";
import AboutMe from "../../components/onboarding/AboutMe";

type StepProps = { form: UseFormReturn<FormValues> };
type StepRenderer = (p: StepProps) => JSX.Element;

const registry: Record<Step, StepRenderer> = {
  about:   ({ form }) => <AboutMe form={form} />,
  birthdate: ({ form }) => <Birthdate form={form} />,
  address: ({ form }) => <Address form={form} />,
};

export default function OnboardingStep() {
  const router = useRouter();
  const form = useFormContext<FormValues>();
  const { getValues, formState } = form;

  // admin config (pages 2 & 3)
  const { data } = useSWR<AdminPages>("/api/config", (url: string) => getAdminConfig(url));

  // parse /onboarding/[step]
  const raw = Array.isArray(router.query.step) ? router.query.step[0] : router.query.step;
  const step = Math.max(1, Math.min(3, Number(raw) || 1));

  // utility: is component assigned to a given page?
  const isOn = React.useCallback(
    (page: 2 | 3, comp: Step) =>
      Boolean(data?.pages.find((p) => p.pageNumber === page)?.components.includes(comp)),
    [data]
  );

  // which fields are required on each page based on admin config
  type F = FieldPath<FormValues>;
  const requiredFieldsFor = React.useCallback(
    (page: 2 | 3): F[] => {
      const out: F[] = [];
      // account (email/password) is step 1 (handled separately)
      if (isOn(page, "address")) {
        out.push(
          "Address.line1",
          "Address.city",
          "Address.state",
          "Address.zip",
        );
      }
      if (isOn(page, "birthdate")) out.push("Birthdate.date");
      // AboutMe is optional everywhere by spec
      return out;
    },
    [isOn]
  );

  // progress (simple 3-step)
  const pct = useMemo(() => Math.round(((step - 1) / (3 - 1)) * 100), [step]);

  // guards
  useEffect(() => {
    const email = String(getValues("email") ?? "").trim();
    const password = String(getValues("password") ?? "").trim();
    if (step >= 2 && (!email || !password)) {
      router.replace("/");
      return;
    }
    // step 3 requires all fields required on page 2 to be filled
    if (step === 3) {
      const filled = requiredFieldsFor(2).every((name) => {
        const v = getValues(name);
        return typeof v === "string" ? v.trim().length > 0 : Boolean(v);
      });
      if (!filled) router.replace("/onboarding/2");
    }
  }, [getValues, requiredFieldsFor, router, step]);

  // navigation
  async function next() {
    if (step === 1) {
      const ok = await form.trigger(["email", "password"]);
      if (!ok) return;
      router.push("/onboarding/2");
      return;
    }
    if (step === 2) {
      const ok = await form.trigger(requiredFieldsFor(2));
      if (!ok) return;
      router.push("/onboarding/3");
    }
  }
  function back() {
    if (step > 1) router.push(`/onboarding/${step - 1}`);
  }

  // submit
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    const ok = await form.trigger([
      "email",
      "password",
      ...requiredFieldsFor(2),
      ...requiredFieldsFor(3),
    ]);
    if (!ok) return;

    try {
      setSaving(true);
      await submitOnboarding({
        email: values.email ?? "",
        ...(values.password ? { password: values.password } : {}),
        AboutMe: values.AboutMe,
        Address: values.Address,
        Birthdate: values.Birthdate,
      });
      router.replace("/success"); // thank-you page
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      setToast(`❌ ${msg}`);
      setTimeout(() => setToast(null), 2600);
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="container shell">
      <div className="aura" /><div className="aura a2" />
      <h1 className="header">Onboarding</h1>

      <div className="card">
        <div className="stepper">
          <div className="chip"><span className="num">1</span><span>Account</span></div>
          <div className="chip"><span className="num">2</span><span>About & Address</span></div>
          <div className="chip"><span className="num">3</span><span>Birthdate</span></div>
        </div>

        <div className="progress" aria-label="Progress">
          <div className="progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress__label">Step {step} of 3</span>

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
              {formState.errors?.email && (
                <p className="error">{String(formState.errors.email.message)}</p>
              )}

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
              {formState.errors?.password && (
                <p className="error">{String(formState.errors.password.message)}</p>
              )}
            </section>
          )}

          {step === 2 && (
            <>
              {isOn(2, "about") && (
                <section className="section">
                  <h2>About Me</h2>
                  <AboutMe form={form} />
                </section>
              )}
              {isOn(2, "address") && (
                <section className="section">
                  <h2>Address</h2>
                  <Address form={form} />
                </section>
              )}
              {/* If admin puts Birthdate on page 2 (allowed by config), render it */}
              {isOn(2, "birthdate") && (
                <section className="section">
                  <h2>Birthdate</h2>
                  <Birthdate form={form} />
                </section>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {isOn(3, "about") && (
                <section className="section">
                  <h2>About Me</h2>
                  <AboutMe form={form} />
                </section>
              )}
              {isOn(3, "address") && (
                <section className="section">
                  <h2>Address</h2>
                  <Address form={form} />
                </section>
              )}
              {isOn(3, "birthdate") && (
                <section className="section">
                  <h2>Birthdate</h2>
                  <Birthdate form={form} />
                </section>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {step > 1 && (
              <button type="button" className="button" onClick={back}>
                ← Back
              </button>
            )}
            {step < 3 && (
              <button type="button" className="button" onClick={next}>
                Next →
              </button>
            )}
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
