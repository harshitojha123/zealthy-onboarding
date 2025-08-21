// pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function IndexRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/onboarding/1"); }, [router]);
  return null;
}
