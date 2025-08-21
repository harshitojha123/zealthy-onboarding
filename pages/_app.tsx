// pages/_app.tsx
import type { AppProps } from "next/app";
import { SWRConfig } from "swr";
import { FormProvider, useForm } from "react-hook-form";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const form = useForm({ mode: "onBlur" });

  return (
    <SWRConfig
      value={{
        // ✅ re-fetch when the page/tab regains focus or comes back online
        revalidateOnFocus: true,
        revalidateOnReconnect: true,

        // keep these if you like; they don’t block revalidation on focus
        dedupingInterval: 5000,
        focusThrottleInterval: 500,
      }}
    >
      <FormProvider {...form}>
        <Component {...pageProps} />
      </FormProvider>
    </SWRConfig>
  );
}
