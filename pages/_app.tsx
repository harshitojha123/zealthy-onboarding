// pages/_app.tsx
import type { AppProps } from "next/app";
import { SWRConfig } from "swr";
import { FormProvider, useForm } from "react-hook-form";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // One RHF instance shared across all pages so values persist between steps/routes
  const form = useForm({ mode: "onBlur" });

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 5000,
        focusThrottleInterval: 5000,
      }}
    >
      <FormProvider {...form}>
        <Component {...pageProps} />
      </FormProvider>
    </SWRConfig>
  );
}
