import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui/button";
import { BookIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="shell section" style={{ maxWidth: 640 }}>
      <EmptyState
        icon={<BookIcon size={28} />}
        title="This page has wandered off the shelf"
        description="The link may be old or the audiobook may have moved. Let's get you back to something good."
        actions={
          <>
            <ButtonLink href="/explore" variant="primary">
              Explore audiobooks
            </ButtonLink>
            <ButtonLink href="/" variant="glass">
              Go home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
