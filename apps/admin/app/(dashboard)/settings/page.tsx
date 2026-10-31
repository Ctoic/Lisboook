import { SectionPlaceholder } from "../../../components/section-placeholder";

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      description="Platform settings are now downstream of the other live sections: website content lives under Website, media lives under Assets, and user visibility lives under Users. This page stays focused on controls that still need backend support."
      items={[
        {
          label: "Brand configuration",
          detail: "Global branding, theme tokens, and shell copy still need dedicated settings endpoints."
        },
        {
          label: "Operational controls",
          detail: "Feature flags, release toggles, and environment-level controls are not exposed yet."
        },
        {
          label: "Audit visibility",
          detail: "Admin audit logs exist in the spec but do not have a consumable admin API route yet."
        }
      ]}
      title="Platform settings"
    />
  );
}
