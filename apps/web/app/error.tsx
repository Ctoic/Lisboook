"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell section" style={{ maxWidth: 640 }}>
      <EmptyState
        icon={<AlertIcon size={28} />}
        title="Something went off-script"
        description="An unexpected error interrupted this page. Try again, or head back home."
        actions={
          <>
            <Button variant="primary" onClick={reset}>
              <RefreshIcon size={18} /> Try again
            </Button>
            <ButtonLink href="/" variant="glass">
              Go home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
