"use client";

import { useEffect, useState } from "react";
import type { CreatorProfileContract } from "@lisbook/types";
import { CreatorGate, InkverseSkeleton } from "@/components/inkverse/creator-gate";
import { Inkwell } from "@/components/inkverse/inkwell";
import { Threshold } from "@/components/inkverse/threshold";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";
import type { InkverseClient } from "@/lib/inkverse-client";

function InkverseHome({ api }: { api: InkverseClient }) {
  // undefined while loading, null when the writer has not crossed the Threshold yet.
  const [profile, setProfile] = useState<CreatorProfileContract | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    api.profile().then(setProfile, (err: Error) => setError(err.message));
  }

  useEffect(load, [api]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="The Inkverse is taking a breather"
          description={error}
          actions={
            <Button variant="primary" onClick={load}>
              <RefreshIcon size={18} /> Try again
            </Button>
          }
        />
      </div>
    );
  }
  if (profile === undefined) return <InkverseSkeleton />;
  if (profile === null) return <Threshold api={api} onCrossed={setProfile} />;
  return <Inkwell api={api} profile={profile} />;
}

export default function InkversePage() {
  return <CreatorGate>{(api) => <InkverseHome api={api} />}</CreatorGate>;
}
