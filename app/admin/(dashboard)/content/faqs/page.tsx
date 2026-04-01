import { AdminSiteContentManager } from "@/components/admin-site-content-manager";
import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "FAQ Copy",
};

export default async function AdminFaqContentPage() {
  const siteContent = await getSiteContent();

  return (
    <AdminSiteContentManager
      description="Keep customer questions and answers in a dedicated admin screen."
      initialSiteContent={siteContent}
      sections={["faqs"]}
      title="FAQs"
    />
  );
}
