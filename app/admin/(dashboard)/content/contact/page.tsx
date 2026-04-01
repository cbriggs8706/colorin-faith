import { AdminSiteContentManager } from "@/components/admin-site-content-manager";
import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "Contact Page Copy",
};

export default async function AdminContactPageContentPage() {
  const siteContent = await getSiteContent();

  return (
    <AdminSiteContentManager
      description="Update the contact-page intro card with your photo, heading, and about text."
      initialSiteContent={siteContent}
      sections={["contactPage"]}
      title="Contact page profile"
    />
  );
}
