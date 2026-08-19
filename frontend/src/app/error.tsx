"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-4 bg-[#f9fafb] px-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff] text-2xl">⚠️</span>
      <h1 className="text-xl font-semibold text-[#111827]">Something went wrong</h1>
      <p className="max-w-md text-sm text-[#6b7280]">
        An unexpected error occurred while loading this page. You can try again or return to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
