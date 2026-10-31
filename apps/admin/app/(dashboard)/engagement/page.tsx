import { SectionPlaceholder } from "../../../components/section-placeholder";

export default function EngagementPage() {
  return (
    <SectionPlaceholder
      description="Engagement operations still need dedicated backend modules for comments, newsletter leads, listening telemetry, and share analytics before this area can become a real operator workspace."
      items={[
        {
          label: "Comment moderation",
          detail: "Backend comment endpoints and moderation queues are not implemented yet."
        },
        {
          label: "Audience signals",
          detail: "Favorites, progress, and listening summaries need customer activity data first."
        },
        {
          label: "Growth capture",
          detail: "Newsletter subscriptions and share tracking need their own persistence layer."
        }
      ]}
      title="Audience and moderation"
    />
  );
}
