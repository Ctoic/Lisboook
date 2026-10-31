import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="empty glass">
      <div className="empty__icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

export function UnavailableState({ retryHref }: { retryHref: string }) {
  return (
    <EmptyState
      icon={<AlertIcon size={28} />}
      title="The library is taking a breather"
      description="We couldn't reach the Lisbook catalog just now. Your saved books are safe — please try again in a moment."
      actions={
        <>
          <ButtonLink href={retryHref} variant="primary" prefetch={false}>
            <RefreshIcon size={18} /> Try again
          </ButtonLink>
          <ButtonLink href="/profile" variant="glass">
            Open your library
          </ButtonLink>
        </>
      }
    />
  );
}
