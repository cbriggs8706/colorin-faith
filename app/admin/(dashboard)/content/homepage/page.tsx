import { AdminSiteContentManager } from "@/components/admin-site-content-manager";
import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "Homepage Copy",
};

export default async function AdminHomepageContentPage() {
  const siteContent = await getSiteContent();

  return (
    <AdminSiteContentManager
      description="Edit the storefront intro, value cards, How It Works section, and homepage newsletter block."
      initialSiteContent={siteContent}
      sections={["homepage"]}
      title="Homepage wording"
    />
  );
}
