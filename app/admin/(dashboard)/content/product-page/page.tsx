import { AdminSiteContentManager } from "@/components/admin-site-content-manager";
import { getSiteContent } from "@/lib/store";

export const metadata = {
  title: "Product Page Copy",
};

export default async function AdminProductPageContentPage() {
  const siteContent = await getSiteContent();

  return (
    <AdminSiteContentManager
      description="Adjust the shared wording that appears across every product page."
      initialSiteContent={siteContent}
      sections={["productPage"]}
      title="Product page wording"
    />
  );
}
